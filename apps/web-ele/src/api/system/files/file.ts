import { requestClient } from '#/api/request';

export interface FileRecordVO {
  id: string;

  fileName: string;

  fileMd5: string;

  fileSize: number;

  fileType: string;

  url: string;

  fileDescription: string;

  // 文件存储路径
  fileStoragePath: string;

  // pdf文件存储路径
  pdfStoragePath: string;

  /* */
  createTime: Date;

  /* */
  updateTime: Date;
}

export type FilePageResult = PageResult<FileRecordVO[]>;

export interface FileRecordQuery extends PageQuery {
  fileName?: string;
}

/**
 * 文件列表
 * queryParams
 * @returns
 */
export async function selectFilePageApi(fileRecordQuery: FileRecordQuery) {
  return requestClient.get<FilePageResult>('/file/page', {
    params: fileRecordQuery,
  });
}

/**
 * 上传文件
 * @param {string} file
 * @returns
 */
export async function fileUploadApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 下载文件
 * @returns
 * @param id
 */
export async function handleDownloadSourceFileApi(id: string) {
  return requestClient.get(`/file/downloadSourceFile/${id}`, {
    responseType: 'blob',
  });
}

/**
 * 下载文件支持断点续传
 * @param id
 * @returns
 */
export async function handleDownloadSourceFileWithResumeApi(id: string) {
  // 返回下载地址，由下载器处理断点续传
  return `/file/downloadSourceFile/${id}`;
}

/**
 * 下载PDF文件支持断点续传
 * @param id
 * @returns
 */
export async function handleDownloadPdfFileWithResumeApi(id: string) {
  // 返回下载地址，由下载器处理断点续传
  return `/file/downloadPdfFile/${id}`;
}

/**
 * 检查文件是否存在
 * @param fileMd5
 * @returns
 */
export async function checkFileExistsApi(fileMd5: string) {
  const params = { fileMd5 };
  return requestClient.post('/file/checkFileExists', params);
}

/**
 * 检查分片是否存在
 * @param identifier
 * @param chunkNumber
 * @returns
 */
export async function checkChunkApi(identifier: string, chunkNumber: number) {
  const params = { identifier, chunkNumber };
  return requestClient.post('/file/checkChunk', params);
}

/**
 * 上传分片
 * @param formData
 * @returns
 */
export async function uploadChunkApi(formData: FormData) {
  // 使用 requestClient 发送 multipart 请求，但确保路径正确
  return requestClient.post('/file/uploadChunk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 合并分片
 * @param data
 * @returns
 */
export async function mergeChunksApi(data: {
  identifier: string;
  filename: string;
  fileMd5: string;
  fileType: string;
  description?: string;
}) {
  return requestClient.post('/file/mergeChunks', data);
}

/**
 * 查询已上传的分片
 * @param identifier
 * @returns
 */
export async function getUploadedChunksApi(identifier: string) {
  const params = { identifier };
  return requestClient.get(`/file/uploadedChunks`, { params });
}

/**
 * 下载pdf文件
 * @param id
 * @returns
 */
export async function handleDownloadPdfFileApi(id: string) {
  return requestClient.get(`/file/downloadPdfFile/${id}`, {
    responseType: 'blob',
  });
}

/**
 * 删除文件
 * @returns
 * @param ids
 */
export async function deleteFileApi(ids: string[]) {
  return requestClient.delete('/file/delete', ids);
}

/**
 * 预览文件
 * @param id
 * @returns
 */
export async function previewFileApi(id: string) {
  return requestClient.get(`/file/preview/${id}`, {
    responseType: 'arraybuffer',
  });
}
