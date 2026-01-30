/**
 * 增强文件下载器，支持断点续传
 */

interface DownloadOptions {
  onProgress?: (progress: number, downloaded: number, total: number) => void;
  onSpeed?: (speed: string) => void; // 速度回调，如 "1.2 MB/s"
  onRetry?: (attempt: number, maxRetries: number) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  chunkSize?: number; // 分片大小，默认 1MB
  maxRetries?: number; // 最大重试次数
  timeout?: number; // 请求超时时间（毫秒）
  token?: string; // 认证令牌
}

export class EnhancedFileDownloader {
  private chunkSize: number = 1024 * 1024; // 默认 1MB
  private maxRetries: number = 3;
  private timeout: number = 30000; // 30秒
  private authToken: string | null = null;

  constructor(options?: DownloadOptions) {
    if (options?.chunkSize) this.chunkSize = options.chunkSize;
    if (options?.maxRetries) this.maxRetries = options.maxRetries;
    if (options?.timeout) this.timeout = options.timeout;
    if (options?.token) this.authToken = options.token;
  }

  /**
   * 获取访问令牌
   */
  private getToken(): string | null {
    // 优先使用构造函数传入的token
    if (this.authToken) {
      return this.authToken;
    }
    
    // 如果没有，则从localStorage中获取
    if (typeof window !== 'undefined' && window.localStorage) {
      // 从localStorage中获取存储的访问令牌
      const storedAuth = localStorage.getItem('core-access-store');
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          return authData.accessToken || null;
        } catch (e) {
          console.warn('解析认证信息失败:', e);
          return null;
        }
      }
    }
    return null;
  }

  /**
   * 断点续传下载文件
   * @param url 下载地址
   * @param filename 文件名
   * @param options 下载选项
   */
  async downloadWithResume(url: string, filename: string, options?: DownloadOptions): Promise<void> {
    const controller = new AbortController();
    const signal = controller.signal;

    try {
      // 首先获取文件大小
      const fileSize = await this.getFileSize(url, signal);
      
      if (fileSize <= this.chunkSize) {
        // 小文件直接下载
        await this.downloadDirect(url, filename, options);
        return;
      }

      // 大文件分片下载
      await this.downloadInChunks(url, filename, fileSize, signal, options);
    } catch (error) {
      if (options?.onError) {
        options.onError(error as Error);
      } else {
        throw error;
      }
    }
  }

  /**
   * 获取文件大小
   */
  private async getFileSize(url: string, signal: AbortSignal): Promise<number> {
    // 获取访问令牌
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'HEAD',
      headers,
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to get file size: ${response.status} ${response.statusText}`);
    }

    const contentLength = response.headers.get('Content-Length');
    if (!contentLength) {
      throw new Error('File size unknown');
    }

    return parseInt(contentLength, 10);
  }

  /**
   * 直接下载（小文件）
   */
  private async downloadDirect(url: string, filename: string, options?: DownloadOptions): Promise<void> {
    // 获取访问令牌
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    this.downloadBlob(blob, filename);

    if (options?.onComplete) {
      options.onComplete();
    }
  }

  /**
   * 分片下载（大文件）
   */
  private async downloadInChunks(
    url: string, 
    filename: string, 
    fileSize: number, 
    signal: AbortSignal,
    options?: DownloadOptions 
  ): Promise<void> {
    // 创建一个数组来存储所有分片
    const chunks: Blob[] = [];
    const totalChunks = Math.ceil(fileSize / this.chunkSize);
    
    let downloaded = 0;
    let startTime = Date.now();
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, fileSize) - 1;
      const range = `bytes=${start}-${end}`;

      let retries = 0;
      let success = false;

      while (!success && retries <= this.maxRetries) {
        try {
          if (signal.aborted) {
            throw new Error('Download aborted');
          }

          // 获取访问令牌
      const token = this.getToken();
      const headers: Record<string, string> = {
        'Range': range,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
            headers,
            signal,
          });

          if (!response.ok && response.status !== 206) { // 206 表示部分内容
            throw new Error(`Chunk download failed: ${response.status} ${response.statusText}`);
          }

          const chunk = await response.blob();
          chunks.push(chunk);

          downloaded += chunk.size;
          
          // 计算进度
          const progress = Math.round((downloaded / fileSize) * 100);
          
          // 计算下载速度
          const elapsed = (Date.now() - startTime) / 1000; // 秒
          const speed = this.formatSpeed(downloaded / elapsed);

          // 回调进度
          if (options?.onProgress) {
            options.onProgress(progress, downloaded, fileSize);
          }
          
          if (options?.onSpeed) {
            options.onSpeed(speed);
          }

          success = true;
        } catch (error) {
          retries++;
          
          if (options?.onRetry) {
            options.onRetry(retries, this.maxRetries);
          }

          if (retries > this.maxRetries) {
            throw new Error(`Failed to download chunk ${i + 1} after ${this.maxRetries} retries: ${(error as Error).message}`);
          }

          // 等待一段时间后重试
          await this.wait(1000 * retries); // 递增延迟
        }
      }
    }

    // 合并所有分片
    const combinedBlob = new Blob(chunks);
    this.downloadBlob(combinedBlob, filename);

    if (options?.onComplete) {
      options.onComplete();
    }
  }

  /**
   * 下载Blob
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * 格式化下载速度
   */
  private formatSpeed(bytesPerSecond: number): string {
    if (isNaN(bytesPerSecond) || bytesPerSecond <= 0) return '0 B/s';
    
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    let unitIndex = 0;
    let speed = bytesPerSecond;

    while (speed >= 1024 && unitIndex < units.length - 1) {
      speed /= 1024;
      unitIndex++;
    }

    return `${speed.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * 等待指定时间
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出便捷函数
export const downloadWithResume = async (
  url: string, 
  filename: string, 
  options?: DownloadOptions
): Promise<void> => {
  const downloader = new EnhancedFileDownloader(options);
  return downloader.downloadWithResume(url, filename, options);
};