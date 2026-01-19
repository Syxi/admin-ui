<script setup lang="ts">
import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus';

import { reactive, ref } from 'vue';

import { ElMessage, genFileId } from 'element-plus';

import { downloadTemplateApi, importUserApi } from '#/api/system/sys/user';

const emit = defineEmits<{ (e: 'success'): void }>();

// 上传组件
const uploadRef = ref<UploadInstance>();

const uploadFile = ref<UploadRawFile>();

const uploadDialog = reactive({
  visible: false,
  title: '导入用户',
});

function closeUploadDialog() {
  uploadRef.value!.clearFiles();
  uploadDialog.visible = false;
}

function openUploadDialog() {
  uploadDialog.visible = true;
}

/**
 * 当文件选择发生变化时，执行的钩子函数
 */
const handleChange: UploadProps['onChange'] = (file) => {
  uploadFile.value = file.raw; // 将文件赋值给 uploadFile.value
};

/**
 * 当超出限制时，执行的钩子函数
 */
const handleFileExceed: UploadProps['onExceed'] = (files) => {
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  uploadFile.value = file;
};

const handleRemoveFile = () => {
  uploadFile.value = null;
  uploadRef.value!.clearFiles();
};

const handleUploadError = () => {};

const importResult = ref<ImportResult>();

// 提交上传文件
const submitUpload = async () => {
  if (!uploadFile.value) {
    ElMessage.error('请先选择文件');
    return false;
  }

  try {
    importResult.value = await importUserApi(uploadFile.value);
    ElMessage({
      message: `导入成功：成功 ${importResult.value.validCount}条， 失败 ${importResult.value.invalidCount} 条`,
      duration: 6000,
      type: 'success',
    });
    closeUploadDialog();
    uploadRef.value!.clearFiles();
    emit('success');
  } catch {
    ElMessage.error('导入失败，请联系管理员');
  } finally {
    importResult.value.validCount = 0;
    importResult.value.invalidCount = 0;
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
  <el-dialog
    v-model="uploadDialog.visible"
    :title="uploadDialog.title"
    :width="600"
    :close-on-click-modal="false"
    center
    @close="closeUploadDialog"
  >
    <el-upload
      drag
      class="upload-demo"
      ref="uploadRef"
      accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
      :limit="1"
      :auto-upload="false"
      :on-change="handleChange"
      :on-exceed="handleFileExceed"
      :on-remove="handleRemoveFile"
      :on-error="handleUploadError"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将文件拖到此处，或<em>点击上传</em>
      </div>

      <template #tip>
        <div class="mb-4 mt-4 flex cursor-pointer justify-center">
          <el-text>仅允许导入 xls、xlsx 格式文件。</el-text>
          <el-text class="ml-10" type="primary" @click="downloadTemplate">下载模版</el-text>
        </div>
      </template>
    </el-upload>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeUploadDialog">取消</el-button>
        <el-button type="primary" @click="submitUpload">导入</el-button>
      </div>
    </template>
  </el-dialog>
</template>
