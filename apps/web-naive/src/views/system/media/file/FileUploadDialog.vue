<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui';

import { nextTick, reactive, ref } from 'vue';

import { NModal, NUpload, NButton, NIcon } from 'naive-ui';
import { message } from '#/hooks';

import { fileUploadApi } from '#/api/system/media/file';

const emit = defineEmits<{ (e: 'success'): void }>();

const uploadRef = ref();

// 数组形式存储用户上传的多文件
let uploadFiles = reactive<UploadFileInfo[]>([]);

const dialog = reactive({
  title: '',
  visible: false,
});

function handleFileChange(options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  uploadFiles.push(options.file);
}

// 删除上传列表的文件
async function handleRemove(file: UploadFileInfo) {
  // 比较文件uid。上传文件的uid和删除文件的uid是否一样
  const index = uploadFiles.findIndex(
    (f) => f.id === file.id,
  );

  // uid相同就可以删除
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

// 打开上传文件窗口
function openDialog() {
  dialog.visible = true;
}

// 关闭上传文件窗口
function closeDialog() {
  // 清空已上传的文件引用
  uploadFiles = [];
  dialog.visible = false;
}

// 上传文件
const submitUpload = () => {
  if (uploadFiles.length === 0) {
    message.error('上传文件不能为空');
    return false;
  }
  Promise.all(
    uploadFiles.map((uploadFile) => {
      return fileUploadApi((uploadFile.file as File));
    }),
  ).then(() => {
    message.success('文件上传成功');
    emit('success');
    // 清空已上传的文件引用
    closeDialog();
  });
};

defineExpose({ openDialog });
</script>
<template>
  <NModal
    v-model:show="dialog.visible"
    title="上传文件"
    :show-icon="false"
    preset="dialog"
    style="width: 800px;"
    @close="closeDialog()"
  >
    <NUpload
      class="upload-demo"
      multiple
      ref="uploadRef"
      :file-list="uploadFiles"
      @update:file-list="handleFileChange"
      :on-remove="handleRemove"
    >
      <div class="upload-area">
        <NIcon><UploadFilled /></NIcon>
        <div class="upload-text">将文件拖到此处，或<em>点击上传</em></div>
      </div>
    </NUpload>

    <template #action>
      <div class="dialog-footer">
        <NButton @click="closeDialog()">取消</NButton>
        <NButton type="primary" @click="submitUpload()">确定</NButton>
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