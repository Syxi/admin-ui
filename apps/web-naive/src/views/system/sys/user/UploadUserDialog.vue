<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui';

import { reactive, ref } from 'vue';

import { NModal, NUpload, NUploadDragger, NIcon, NText, NSpace, NButton } from 'naive-ui';
import { message } from '#/adapter/naive';

import { downloadTemplateApi, importUserApi } from '#/api/system/sys/user';

const emit = defineEmits<{ (e: 'success'): void }>();

// 上传组件
const uploadRef = ref();

const uploadFile = ref<File>();

const uploadDialog = reactive({
  visible: false,
  title: '导入用户',
});

function closeUploadDialog() {
  // naive-ui上传组件清除文件的逻辑
  uploadDialog.visible = false;
}

function openUploadDialog() {
  uploadDialog.visible = true;
}

/**
 * 当文件选择发生变化时，执行的钩子函数
 */
const handleChange = (options: { file: UploadFileInfo, fileList: UploadFileInfo[] }) => {
  uploadFile.value = options.file.file as File; // 将文件赋值给 uploadFile.value
};

/**
 * 当超出限制时，执行的钩子函数
 */
const handleFileExceed = (options: { file: UploadFileInfo, fileList: UploadFileInfo[] }) => {
  const file = options.file;
  // 在naive-ui中不需要生成ID
  uploadFile.value = file.file as File;
};

const handleRemoveFile = () => {
  uploadFile.value = undefined;
  // naive-ui上传组件清除文件的逻辑
};

const handleUploadError = () => {};

const importResult = ref<ImportResult>();

// 提交上传文件
const submitUpload = async () => {
  if (!uploadFile.value) {
    message.error('请先选择文件');
    return false;
  }

  try {
    importResult.value = await importUserApi(uploadFile.value);
    message.success(`导入成功：成功 ${importResult.value.validCount}条， 失败 ${importResult.value.invalidCount} 条`, { duration: 6000 });
    closeUploadDialog();
    // naive-ui上传组件清除文件的逻辑
    emit('success');
  } catch {
    message.error('导入失败，请联系管理员');
  } finally {
    if (importResult.value) {
      importResult.value.validCount = 0;
      importResult.value.invalidCount = 0;
    }
  }
};

/**
 * 下载用户导入模板
 */
async function downloadTemplate() {
  const response = await downloadTemplateApi();
  const fileData = response.data;
  const fileName = decodeURI(
    response.headers['content-disposition'].split(';')[1].split('=')[1],
  );
  const fileType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8';

  const blob = new Blob([fileData], { type: fileType });
  const downloadUrl = window.URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = fileName;

  document.body.append(downloadLink);
  downloadLink.click();

  downloadLink.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

defineExpose({ openUploadDialog });
</script>
<template>
  <n-modal
    v-model:show="uploadDialog.visible"
    :title="uploadDialog.title"
    :bordered="false"
    size="huge"
    @close="closeUploadDialog"
  >
    <n-upload
      multiple
      :max="1"
      :show-file-list="true"
      :on-change="handleChange"
      :on-exceed="handleFileExceed"
      accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
    >
      <n-upload-dragger>
        <div class="upload__text">
          <n-icon size="36" :depth="3">
            <upload-filled />
          </n-icon>
          <p>将文件拖到此处，或点击上传</p>
        </div>
      </n-upload-dragger>
    </n-upload>
    <div class="mb-4 mt-4 flex cursor-pointer justify-center">
      <n-text>仅允许导入 xls、xlsx 格式文件。</n-text>
      <n-text class="ml-10" type="primary" @click="downloadTemplate">下载模版</n-text>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <n-space>
          <n-button @click="closeUploadDialog">取消</n-button>
          <n-button type="primary" @click="submitUpload">导入</n-button>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>
