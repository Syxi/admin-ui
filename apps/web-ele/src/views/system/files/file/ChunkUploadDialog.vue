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

// 上传单个分片
async function uploadSingleChunk(identifier: string, chunk: Blob, chunkNumber: number, totalChunks: number, totalSize: number, filename: string, chunkHash: string) {
  const formData = new FormData();
  formData.append('identifier', identifier);
  formData.append('chunkNumber', chunkNumber);
  formData.append('totalChunks', totalChunks);
  formData.append('totalSize', totalSize);
  formData.append('filename', filename);
  formData.append('chunkHash', chunkHash);
  formData.append('file', chunk);

  try {
    const response = await uploadChunkApi(formData);
    return response;
  } catch (error) {
    console.error(`上传分片 ${chunkNumber} 失败:`, error);
    throw error;
  }
}

// 分片上传主函数
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
    for (let i = 0; i < chunks; i++) {
      const exists = await checkChunkExists(fileMd5, i);
      if (exists) {
        status.uploadedChunks.push(i);
      }
    }

    // 上传未完成的分片
    for (let i = 0; i < chunks; i++) {
      if (status.uploadedChunks.includes(i)) {
        // 已上传的分片，更新进度
        status.progress = Math.floor(((i + 1) / chunks) * 100);
        continue;
      }

      // 切割分片
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      // 计算分片MD5
      const chunkBlob = new Blob([chunk]);
      const chunkArrayBuffer = await chunkBlob.arrayBuffer();
      const spark = new SparkMD5.ArrayBuffer();
      spark.append(chunkArrayBuffer);
      const chunkHash = spark.end();

      // 上传分片
      try {
        await uploadSingleChunk(fileMd5, chunk, i, chunks, file.size, file.name, chunkHash);
        status.uploadedChunks.push(i);
        status.progress = Math.floor(((i + 1) / chunks) * 100);
      } catch (error) {
        status.status = 'error';
        ElMessage.error(`分片 ${i + 1} 上传失败: ${error}`);
        throw error;
      }
    }

    // 合并分片
    try {
      // 更新状态为合并中
      status.status = 'uploading';
      status.progress = 99; // 设置接近完成但仍显示进行中
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
    }
  } catch (error) {
    status.status = 'error';
    console.error('文件上传失败:', error);
    ElMessage.error(`${file.name} 上传失败: ${error}`);
  }
}

// 开始上传所有文件
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

  // 并行上传所有文件
  const uploadPromises = uploadFiles.map((uploadFile, index) => {
    return uploadFileWithChunks(uploadFile.raw, uploadFile.uid);
  });

  try {
    await Promise.all(uploadPromises);
    emit('success');
    closeDialog();
  } catch (error) {
    console.error('批量上传失败:', error);
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
    case 'uploading': return `上传中 ${status.progress}%`;
    case 'success': return '上传成功';
    case 'error': return '上传失败';
    default: return '未知';
  }
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
      <h4>上传状态</h4>
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
        <el-table-column prop="status" label="状态" width="100">
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
</style>
