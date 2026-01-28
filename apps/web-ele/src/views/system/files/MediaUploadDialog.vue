<template>
  <el-dialog
    v-model="dialog.visible"
    :title="dialog.title"
    width="800"
    center
    @close="closeDialog()"
  >
    <!-- 媒体类型选择 -->
    <el-form :model="uploadConfig" label-width="100px">
      <el-form-item label="上传类型">
        <el-radio-group v-model="uploadConfig.mediaType" @change="handleMediaTypeChange">
          <el-radio label="file">通用文件</el-radio>
          <el-radio label="image">图片</el-radio>
          <el-radio label="video">视频</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <el-upload
      class="upload-demo"
      drag
      multiple
      ref="uploadRef"
      :file-list="uploadFiles"
      :on-exceed="handleFileExceed"
      :on-change="handleFileChange"
      :on-remove="handleRemove"
      :before-upload="beforeUpload"
      :auto-upload="false"
      :accept="acceptedFileTypes"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <div class="el-upload__tip">
        <div v-if="uploadConfig.mediaType === 'image'">只能上传jpg/png文件，且不超过5MB</div>
        <div v-else-if="uploadConfig.mediaType === 'video'">只能上传mp4/avi/mov等视频文件，且不超过500MB</div>
        <div v-else>支持上传各种类型的文件，不超过500MB</div>
      </div>
    </el-upload>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog()">取消</el-button>
        <el-button type="primary" @click="submitUpload()">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { UploadInstance, UploadUserFile } from 'element-plus';

import { nextTick, reactive, ref, computed } from 'vue';

import { ElMessage } from 'element-plus';

import { fileUploadApi } from '#/api/system/media/file';
import { uploadImageApi } from '#/api/system/media/image';
import { uploadVideoApi } from '#/api/system/media/video';

const emit = defineEmits<{ (e: 'success'): void }>();

const uploadRef = ref<UploadInstance>();

// 数组形式存储用户上传的多文件
let uploadFiles = reactive<UploadUserFile[]>([]);

const dialog = reactive({
  title: '上传媒体文件',
  visible: false,
});

// 上传配置
const uploadConfig = reactive({
  mediaType: 'file', // 'file', 'image', 'video'
});

// 根据媒体类型确定可接受的文件类型
const acceptedFileTypes = computed(() => {
  switch (uploadConfig.mediaType) {
    case 'image':
      return '.jpg,.jpeg,.png,.gif,.bmp,.webp';
    case 'video':
      return '.mp4,.avi,.mov,.wmv,.flv,.webm,.m4v,.mkv';
    default:
      return '*/*'; // 所有文件类型
  }
});

/**
 * 处理文件超出限制
 */
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

/**
 * 处理文件变化
 */
function handleFileChange(file: any) {
  // 验证文件类型
  if (!validateFileType(file.raw)) {
    ElMessage.error(`不支持的文件类型: ${file.raw.type}`);
    return;
  }
  
  // 验证文件大小
  if (!validateFileSize(file.raw)) {
    ElMessage.error('文件大小超出限制');
    return;
  }
  
  uploadFiles.push({
    raw: file.raw,
    name: file.name,
  });
}

/**
 * 删除上传列表的文件
 */
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

/**
 * 验证文件类型
 */
function validateFileType(file: File): boolean {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  
  switch (uploadConfig.mediaType) {
    case 'image':
      return (
        fileType.startsWith('image/') ||
        fileName.endsWith('.jpg') ||
        fileName.endsWith('.jpeg') ||
        fileName.endsWith('.png') ||
        fileName.endsWith('.gif') ||
        fileName.endsWith('.bmp') ||
        fileName.endsWith('.webp')
      );
    case 'video':
      return (
        fileType.startsWith('video/') ||
        fileName.endsWith('.mp4') ||
        fileName.endsWith('.avi') ||
        fileName.endsWith('.mov') ||
        fileName.endsWith('.wmv') ||
        fileName.endsWith('.flv') ||
        fileName.endsWith('.webm') ||
        fileName.endsWith('.m4v') ||
        fileName.endsWith('.mkv')
      );
    default:
      return true; // 通用文件类型不做限制
  }
}

/**
 * 验证文件大小
 */
function validateFileSize(file: File): boolean {
  const maxSize = uploadConfig.mediaType === 'video' ? 500 * 1024 * 1024 : 5 * 1024 * 1024; // 视频最大500MB，其他文件最大5MB
  return file.size <= maxSize;
}

/**
 * 上传前验证
 */
function beforeUpload(file: File): boolean {
  if (!validateFileType(file)) {
    ElMessage.error(`不支持的文件类型: ${file.type}`);
    return false;
  }
  
  if (!validateFileSize(file)) {
    ElMessage.error('文件大小超出限制');
    return false;
  }
  
  return true;
}

/**
 * 媒体类型改变
 */
function handleMediaTypeChange() {
  // 清空当前上传列表
  uploadFiles = [];
  uploadRef.value?.clearFiles();
}

/**
 * 打开上传文件窗口
 */
function openDialog() {
  dialog.visible = true;
  // 重置为默认类型
  uploadConfig.mediaType = 'file';
}

/**
 * 关闭上传文件窗口
 */
function closeDialog() {
  // 清空已上传的文件引用
  uploadFiles = [];
  uploadRef.value?.clearFiles();
  dialog.visible = false;
}

/**
 * 上传文件
 */
const submitUpload = async () => {
  if (uploadFiles.length === 0) {
    ElMessage.error('上传文件不能为空');
    return false;
  }

  try {
    // 根据媒体类型调用不同的上传API
    const uploadPromises = uploadFiles.map((uploadFile) => {
      switch (uploadConfig.mediaType) {
        case 'image':
          return uploadImageApi(uploadFile.raw);
        case 'video':
          return uploadVideoApi(uploadFile.raw);
        default:
          return fileUploadApi(uploadFile.raw);
      }
    });

    await Promise.all(uploadPromises);
    ElMessage.success(`${uploadConfig.mediaType === 'image' ? '图片' : uploadConfig.mediaType === 'video' ? '视频' : '文件'}上传成功`);
    emit('success');
    // 清空已上传的文件引用
    closeDialog();
  } catch (error) {
    console.error('文件上传失败:', error);
    ElMessage.error('文件上传失败');
  }
};

defineExpose({ openDialog });
</script>

<style scoped>
.upload-demo {
  margin-bottom: 20px;
}

.el-upload__tip {
  line-height: 1.4;
  color: #909399;
  font-size: 12px;
  margin-top: 10px;
}
</style>