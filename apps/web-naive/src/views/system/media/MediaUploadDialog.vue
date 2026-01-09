<template>
  <n-modal v-model:show="dialog.visible" :title="dialog.title" preset="card" style="width: 800px; max-width: 90vw;">
    <!-- 媒体类型选择 -->
    <n-form :model="uploadConfig" label-width="100px">
      <n-form-item label="上传类型">
        <n-radio-group v-model:value="uploadConfig.mediaType" @update-value="handleMediaTypeChange">
          <n-radio value="file">通用文件</n-radio>
          <n-radio value="image">图片</n-radio>
          <n-radio value="video">视频</n-radio>
        </n-radio-group>
      </n-form-item>
    </n-form>

    <n-upload
      class="upload-demo"
      multiple
      :file-list="uploadFiles"
      @update:file-list="handleFileListUpdate"
      :accept="acceptedFileTypes"
      :show-file-list="true"
      :max="10"  <!-- 限制最多上传10个文件 -->
    >
      <n-upload-dragger>
        <div style="margin-bottom: 12px;">
          <n-icon size="48" depth="3">
            <Icon icon="mdi:upload" />
          </n-icon>
        </div>
        <n-text style="font-size: 16px;">
          点击或者拖动文件到该区域来上传
        </n-text>
        <n-p depth="3" style="margin: 8px 0 0 0;">
          <div v-if="uploadConfig.mediaType === 'image'">只能上传jpg/png文件，且不超过5MB</div>
          <div v-else-if="uploadConfig.mediaType === 'video'">只能上传mp4/avi/mov等视频文件，且不超过500MB</div>
          <div v-else>支持上传各种类型的文件，不超过500MB</div>
        </n-p>
      </n-upload-dragger>
    </n-upload>

    <template #footer>
      <div class="dialog-footer">
        <n-space justify="end">
          <n-button @click="closeDialog()">取消</n-button>
          <n-button type="primary" @click="submitUpload()">确定</n-button>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui';
import { nextTick, reactive, ref, computed } from 'vue';
import { useMessage, NModal, NForm, NFormItem, NRadioGroup, NRadio, NUpload, NUploadDragger, NIcon, NText, NP, NButton, NSpace } from 'naive-ui';
import { Icon } from '@iconify/vue';
import { fileUploadApi } from '#/api/system/media/file';
import { uploadImageApi } from '#/api/system/media/image';
import { uploadVideoApi } from '#/api/system/media/video';

const emit = defineEmits<{ (e: 'success'): void }>();

const message = useMessage();

// 数组形式存储用户上传的多文件
let uploadFiles = reactive<UploadFileInfo[]>([]);

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
 * 处理文件列表更新
 */
function handleFileListUpdate(fileList: UploadFileInfo[]) {
  // 验证每个新添加的文件
  const validFiles = fileList.filter(file => {
    if (file.file && !validateFileType(file.file)) {
      message.error(`不支持的文件类型: ${file.file.type}`);
      return false;
    }
    
    if (file.file && !validateFileSize(file.file)) {
      message.error('文件大小超出限制');
      return false;
    }
    
    return true;
  });
  
  uploadFiles = validFiles;
}

/**
 * 删除上传列表的文件
 */
async function handleRemove(uploadFile: UploadFileInfo) {
  // 从上传列表文件中移除文件
  const index = uploadFiles.findIndex(
    (file) => file.id === uploadFile.id,
  );

  // id相同就可以删除
  if (index === -1) {
    message.error('文件未找到，无法删除');
  } else {
    // 从上传列表文件中移除文件
    uploadFiles.splice(index, 1);
    // 等待DOM更新后再显示信息
    await nextTick();
    message.success('文件已从上传列表移除');
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
 * 媒体类型改变
 */
function handleMediaTypeChange() {
  // 清空当前上传列表
  uploadFiles = [];
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
  dialog.visible = false;
}

/**
 * 上传文件
 */
const submitUpload = async () => {
  if (uploadFiles.length === 0) {
    message.error('上传文件不能为空');
    return false;
  }

  try {
    // 根据媒体类型调用不同的上传API
    const uploadPromises = uploadFiles.map((uploadFile) => {
      if (!uploadFile.file) {
        return Promise.reject(new Error('文件不存在'));
      }
      
      switch (uploadConfig.mediaType) {
        case 'image':
          return uploadImageApi(uploadFile.file);
        case 'video':
          return uploadVideoApi(uploadFile.file);
        default:
          return fileUploadApi(uploadFile.file);
      }
    });

    await Promise.all(uploadPromises);
    message.success(`${uploadConfig.mediaType === 'image' ? '图片' : uploadConfig.mediaType === 'video' ? '视频' : '文件'}上传成功`);
    emit('success');
    // 清空已上传的文件引用
    closeDialog();
  } catch (error) {
    console.error('文件上传失败:', error);
    message.error('文件上传失败');
  }
};

defineExpose({ openDialog });
</script>

<style scoped>
.upload-demo {
  margin-bottom: 20px;
}
</style>