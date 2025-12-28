<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui';

import { nextTick, reactive, ref } from 'vue';

import { NModal, NUpload, NButton, NIcon } from 'naive-ui';
import { message } from '#/hooks';

import { uploadImageApi } from '#/api/system/media/image';

const emit = defineEmits<{ (e: 'success'): void }>();

const uploadRef = ref();

// 数组形式存储用户上传的多图片
let uploadFiles = reactive<UploadFileInfo[]>([]);

function handleFileChange(options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  uploadFiles.push(options.file);
}

// 删除上传列表的图片
async function handleRemove(file: UploadFileInfo) {
  // 比较图片uid。上传图片的uid和删除图片的uid是否一样
  const index = uploadFiles.findIndex(
    (f) => f.id === file.id,
  );

  // uid相同就可以删除
  if (index === -1) {
    message.error('图片未找到，无法删除');
  } else {
    // 从上传列表图片中移除图片
    uploadFiles.splice(index, 1);
    // 等待DOM更新后再显示信息
    await nextTick();
    message.success('图片已从上传列表移除');
  }
}

// 只接受图片文件
function beforeUpload(file: File) {
  const isImage = [
    'image/gif',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ].includes(file.type);
  if (!isImage) {
    message.error('上传文件只能是图片格式!');
    return false;
  }

  return isImage;
}

const dialog = reactive({
  title: '上传图片',
  visible: false,
});

// 打开上传图片窗口
function openUploadDialog() {
  dialog.visible = true;
}

// 关闭上传图片窗口
function closeDialog() {
  // 清空已上传的图片引用
  uploadFiles = [];
  dialog.visible = false;
}

// 上传图片
const submitUpload = () => {
  if (uploadFiles.length === 0) {
    message.error('上传图片不能为空');
    return false;
  }
  Promise.all(
    uploadFiles.map((uploadFile) => {
      return uploadImageApi((uploadFile.file as File));
    }),
  ).then(() => {
    message.success('图片上传成功');
    emit('success');
    // 清空已上传的图片引用
    closeDialog();
  });
};

defineExpose({ openUploadDialog });
</script>
<template>
  <NModal
    v-model:show="dialog.visible"
    :title="dialog.title"
    :show-icon="false"
    preset="dialog"
    style="width: 800px;"
    @close="closeDialog()"
  >
    <NUpload
      class="upload-demo"
      ref="uploadRef"
      :file-list="uploadFiles"
      @update:file-list="handleFileChange"
      :on-remove="handleRemove"
      :before-upload="beforeUpload"
      accept=".jpg,.jpeg,.png,.gif"
      :multiple="true"
    >
      <div class="upload-area">
        <NIcon><UploadFilled /></NIcon>
        <div class="upload-text">将文件拖到此处，或<em>点击上传</em></div>
      </div>
    </NUpload>

    <template #action>
      <div class="dialog-footer">
        <NButton @click="closeDialog()">取消</NButton>
        <NButton type="primary" @click="submitUpload">确定</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-text {
  margin-top: 16px;
  color: #666;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
  font-weight: bold;
}
</style>