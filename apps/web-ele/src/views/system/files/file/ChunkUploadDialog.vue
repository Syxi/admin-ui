<script setup lang="ts">
import type { UploadInstance, UploadUserFile } from 'element-plus';
import { nextTick, reactive, ref } from 'vue';
import SparkMD5 from 'spark-md5';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  fileUploadApi,
  checkFileExistsApi,
  checkChunkApi,
  uploadChunkApi,
  mergeChunksApi
} from '#/api/system/files/file';

const emit = defineEmits<{ (e: 'success'): void }>();

const uploadRef = ref<UploadInstance>();

// 数组形式存储用户上传的多文件
const uploadFiles = reactive<UploadUserFile[]>([]);

const dialog = reactive({
  title: '',
  visible: false,
});

function handleFileExceed(files: any[]) {
  const excessFiles = files.slice(1); // 仅保留超出的文件
  excessFiles.forEach((file) => {
    uploadFiles.push({
      uid: file.uid,
      raw: file.raw,
      name: file.name,
    });
  });
}

function handleFileChange(file: any) {
  uploadFiles.push({
    raw: file.raw,
    name: file.name,
  });
}

// 删除上传列表的文件
async function handleRemove(uploadFile: UploadUserFile) {
  // 比较文件uid。上传文件的uid和删除文件的uid是否一样
  const index = uploadFiles.findIndex(
    (file) => file.raw.uid === uploadFile.uid,
  );

  // uid相同就可以删除
  if (index === -1) {
    ElMessage.error('文件未找到，无法删除');
  } else {
    // 从上传列表文件中移除文件
    uploadFiles.splice(index, 1);
    // 等待DOM更新后再显示信息
    await nextTick();
    ElMessage.success('文件已从上传列表移除');
  }
}

// 分片大小，默认10MB
const CHUNK_SIZE = 10 * 1024 * 1024;

// 上传并发控制配置
const UPLOAD_CONFIG = {
  CHUNK_CONCURRENCY: 3,      // 分片并发上传数
  FILE_CONCURRENCY: 3,       // 文件并发上传数
  RETRY_ATTEMPTS: 3,         // 重试次数
  RETRY_DELAY_BASE: 1000,    // 重试基础延迟(ms)
  PROGRESS_UPDATE_INTERVAL: 100 // 进度更新间隔(ms)
};

// 文件处理状态
interface FileStatus {
  uid: string;
  fileName: string;
  file: File;
  chunks: number;
  uploadedChunks: number[];
  status: 'waiting' | 'uploading' | 'success' | 'error';
  progress: number;
  totalSize: number;
  identifier: string;
}

const fileStatuses = ref<FileStatus[]>([]);

// 计算文件MD5
async function calculateMD5(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
    const chunkSize = 2097152; // 2MB chunks
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = start + chunkSize >= file.size ? file.size : start + chunkSize;

      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    }

    fileReader.onload = function(e) {
      spark.append(e.target!.result as ArrayBuffer);
      currentChunk++;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };

    fileReader.onerror = function() {
      reject('文件读取失败');
    };

    loadNext();
  });
}

// 检查文件是否已存在
async function checkFileExists(fileMd5: string): Promise<boolean> {
  try {
    const response = await checkFileExistsApi(fileMd5);
    return response;
  } catch (error) {
    console.error('检查文件是否存在失败:', error);
    return false;
  }
}

// 检查分片是否存在
async function checkChunkExists(identifier: string, chunkNumber: number): Promise<boolean> {
  try {
    const response = await checkChunkApi(identifier, chunkNumber);
    return response;
  } catch (error) {
    console.error(`检查分片 ${chunkNumber} 是否存在失败:`, error);
    return false;
  }
}

// 上传队列管理器
class UploadQueue {
  private activeUploads: number = 0;
  private maxConcurrent: number = UPLOAD_CONFIG.CHUNK_CONCURRENCY;
  private queue: Array<() => Promise<any>> = [];

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.activeUploads >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.activeUploads++;
    const task = this.queue.shift()!;
    
    try {
      await task();
    } finally {
      this.activeUploads--;
      this.processQueue();
    }
  }
}

// 全局上传队列实例
const uploadQueue = new UploadQueue();

// 上传单个分片（带重试和队列控制）
async function uploadSingleChunk(identifier: string, chunk: Blob, chunkNumber: number, totalChunks: number, totalSize: number, filename: string, chunkHash: string, retryCount: number = 0): Promise<any> {
  const formData = new FormData();
  formData.append('identifier', identifier);
  formData.append('chunkNumber', chunkNumber);
  formData.append('totalChunks', totalChunks);
  formData.append('totalSize', totalSize);
  formData.append('filename', filename);
  formData.append('chunkHash', chunkHash);
  formData.append('file', chunk);

  try {
    // 使用队列控制并发
    const response = await uploadQueue.add(() => uploadChunkApi(formData));
    return response;
  } catch (error) {
    console.error(`上传分片 ${chunkNumber} 失败 (尝试 ${retryCount + 1}/${UPLOAD_CONFIG.RETRY_ATTEMPTS}):`, error);
    
    // 重试逻辑
    if (retryCount < UPLOAD_CONFIG.RETRY_ATTEMPTS - 1) {
      const delay = UPLOAD_CONFIG.RETRY_DELAY_BASE * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      return uploadSingleChunk(identifier, chunk, chunkNumber, totalChunks, totalSize, filename, chunkHash, retryCount + 1);
    }
    
    throw error;
  }
}

// 分片上传主函数（优化版本）
async function uploadFileWithChunks(file: File, uid: string) {
  const status = fileStatuses.value.find(s => s.uid === uid);
  if (!status) return;

  try {
    // 计算文件MD5作为标识符
    status.status = 'uploading';
    status.progress = 0;

    // 计算文件MD5
    const fileMd5 = await calculateMD5(file);
    status.identifier = fileMd5;

    // 检查文件是否已存在
    const exists = await checkFileExists(fileMd5);
    if (exists) {
      ElMessage.success(`${file.name} 已存在于服务器，跳过上传`);
      status.status = 'success';
      status.progress = 100;
      return;
    }

    // 计算分片数量
    const chunks = Math.ceil(file.size / CHUNK_SIZE);
    status.chunks = chunks;
    status.uploadedChunks = [];

    // 检查已上传的分片
    const checkPromises = [];
    for (let i = 0; i < chunks; i++) {
      checkPromises.push(
        checkChunkExists(fileMd5, i).then(exists => ({ index: i, exists }))
      );
    }
    
    const checkResults = await Promise.all(checkPromises);
    checkResults.forEach(({ index, exists }) => {
      if (exists) {
        status.uploadedChunks.push(index);
      }
    });

    // 批量上传未完成的分片（并发控制）
    const remainingChunks = [];
    for (let i = 0; i < chunks; i++) {
      if (!status.uploadedChunks.includes(i)) {
        remainingChunks.push(i);
      }
    }

    // 分批处理剩余分片
    const chunkBatches = [];
    for (let i = 0; i < remainingChunks.length; i += UPLOAD_CONFIG.CHUNK_CONCURRENCY) {
      chunkBatches.push(remainingChunks.slice(i, i + UPLOAD_CONFIG.CHUNK_CONCURRENCY));
    }

    // 逐批上传分片
    for (const batch of chunkBatches) {
      const batchPromises = batch.map(async (chunkIndex) => {
        // 切割分片
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // 计算分片MD5
        const chunkBlob = new Blob([chunk]);
        const chunkArrayBuffer = await chunkBlob.arrayBuffer();
        const spark = new SparkMD5.ArrayBuffer();
        spark.append(chunkArrayBuffer);
        const chunkHash = spark.end();

        // 上传分片
        await uploadSingleChunk(fileMd5, chunk, chunkIndex, chunks, file.size, file.name, chunkHash);
        
        // 更新状态
        status.uploadedChunks.push(chunkIndex);
        const newProgress = Math.floor((status.uploadedChunks.length / chunks) * 95); // 留5%给合并
        if (newProgress > status.progress) {
          status.progress = newProgress;
        }
      });

      // 等待批次完成
      await Promise.all(batchPromises);
    }

    // 合并分片
    try {
      // 更新状态为合并中
      status.status = 'uploading';
      status.progress = 95;
      ElMessage.info(`${file.name} 分片上传完成，正在合并文件...`);
      
      await mergeChunksApi({
        identifier: fileMd5,
        filename: file.name,
        fileMd5,
        fileType: file.type || 'application/octet-stream'
      });

      status.status = 'success';
      status.progress = 100;
      ElMessage.success(`${file.name} 上传合并成功`);
    } catch (error) {
      status.status = 'error';
      ElMessage.error(`${file.name} 合并失败: ${error}`);
      throw error;
    }
  } catch (error) {
    status.status = 'error';
    console.error('文件上传失败:', error);
    ElMessage.error(`${file.name} 上传失败: ${error}`);
    throw error;
  }
}

// 开始上传所有文件（优化版本）
async function startUpload() {
  if (uploadFiles.length === 0) {
    ElMessage.error('上传文件不能为空');
    return false;
  }

  // 初始化文件状态
  fileStatuses.value = uploadFiles.map(uploadFile => ({
    uid: uploadFile.uid,
    fileName: uploadFile.name,
    file: uploadFile.raw,
    chunks: 0,
    uploadedChunks: [],
    status: 'waiting',
    progress: 0,
    totalSize: uploadFile.raw.size,
    identifier: ''
  }));

  // 文件并发控制
  const fileBatches = [];
  const filesArray = [...uploadFiles];
  
  for (let i = 0; i < filesArray.length; i += UPLOAD_CONFIG.FILE_CONCURRENCY) {
    fileBatches.push(filesArray.slice(i, i + UPLOAD_CONFIG.FILE_CONCURRENCY));
  }

  // 逐批上传文件
  for (const batch of fileBatches) {
    const batchPromises = batch.map((uploadFile) => {
      return uploadFileWithChunks(uploadFile.raw, uploadFile.uid);
    });

    try {
      await Promise.all(batchPromises);
    } catch (error) {
      console.error('批次上传失败:', error);
      // 继续处理下一个批次，不中断整个上传过程
    }
  }

  // 检查是否所有文件都上传成功
  const failedFiles = fileStatuses.value.filter(status => status.status === 'error');
  const successFiles = fileStatuses.value.filter(status => status.status === 'success');
  
  if (failedFiles.length > 0) {
    ElMessage.warning(`上传完成：${successFiles.length}个成功，${failedFiles.length}个失败`);
  } else {
    ElMessage.success(`所有文件上传成功 (${successFiles.length}个)`);
    emit('success');
    closeDialog();
  }
}

// 打开上传文件窗口
function openDialog() {
  dialog.visible = true;
}

// 关闭上传文件窗口
function closeDialog() {
  // 清空已上传的文件引用
  uploadRef.value?.clearFiles();
  fileStatuses.value = [];
  uploadFiles.splice(0);
  dialog.visible = false;
}

// 获取文件状态显示文本
function getStatusText(status: FileStatus) {
  switch (status.status) {
    case 'waiting': return '等待中';
    case 'uploading': 
      if (status.progress >= 95) {
        return '合并中...';
      }
      return `上传中 ${status.progress}%`;
    case 'success': return '上传成功';
    case 'error': return '上传失败';
    default: return '未知';
  }
}

// 获取上传统计信息
function getUploadStats() {
  const totalFiles = fileStatuses.value.length;
  const completedFiles = fileStatuses.value.filter(s => s.status === 'success').length;
  const failedFiles = fileStatuses.value.filter(s => s.status === 'error').length;
  const uploadingFiles = fileStatuses.value.filter(s => s.status === 'uploading').length;
  
  return {
    total: totalFiles,
    completed: completedFiles,
    failed: failedFiles,
    uploading: uploadingFiles
  };
}

// 获取状态标签类型
function getStatusType(status: FileStatus) {
  switch (status.status) {
    case 'waiting': return 'info';
    case 'uploading': return 'primary';
    case 'success': return 'success';
    case 'error': return 'danger';
    default: return 'info';
  }
}

defineExpose({ openDialog });
</script>

<template>
  <el-dialog
    v-model="dialog.visible"
    title="大文件分片上传"
    width="800"
    center
    @close="closeDialog()"
  >
    <el-upload
      class="upload-demo"
      drag
      multiple
      ref="uploadRef"
      :file-list="uploadFiles"
      :on-exceed="handleFileExceed"
      :on-change="handleFileChange"
      :on-remove="handleRemove"
      :auto-upload="false"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">
          支持大文件分片上传和断点续传
        </div>
      </template>
    </el-upload>

    <!-- 上传状态列表 -->
    <div v-if="fileStatuses.length > 0" class="mt-4">
      <div class="upload-stats mb-3">
        <h4>上传统计</h4>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-item">
                <span class="stat-label">总计:</span>
                <span class="stat-value">{{ getUploadStats().total }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card success">
              <div class="stat-item">
                <span class="stat-label">成功:</span>
                <span class="stat-value">{{ getUploadStats().completed }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card warning">
              <div class="stat-item">
                <span class="stat-label">上传中:</span>
                <span class="stat-value">{{ getUploadStats().uploading }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card danger">
              <div class="stat-item">
                <span class="stat-label">失败:</span>
                <span class="stat-value">{{ getUploadStats().failed }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <h4>文件详情</h4>
      <el-table :data="fileStatuses" style="width: 100%">
        <el-table-column prop="fileName" label="文件名" width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.fileName" placement="top">
              <span>{{ row.fileName.length > 20 ? row.fileName.substring(0, 20) + '...' : row.fileName }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="totalSize" label="大小" width="100">
          <template #default="{ row }">
            {{ (row.totalSize / 1024 / 1024).toFixed(2) }} MB
          </template>
        </el-table-column>
        <el-table-column prop="chunks" label="分片数" width="80" />
        <el-table-column label="进度" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :status="row.status === 'error' ? 'exception' : undefined" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)">
              {{ getStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog()">取消</el-button>
        <el-button type="primary" @click="startUpload()">开始上传</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.mt-4 {
  margin-top: 1rem;
}

.mb-3 {
  margin-bottom: 1rem;
}

.upload-stats {
  margin-bottom: 1.5rem;
}

.stat-card {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card.success {
  border-color: var(--el-color-success);
}

.stat-card.warning {
  border-color: var(--el-color-warning);
}

.stat-card.danger {
  border-color: var(--el-color-danger);
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.stat-card.success .stat-value {
  color: var(--el-color-success);
}

.stat-card.warning .stat-value {
  color: var(--el-color-warning);
}

.stat-card.danger .stat-value {
  color: var(--el-color-danger);
}
</style>
