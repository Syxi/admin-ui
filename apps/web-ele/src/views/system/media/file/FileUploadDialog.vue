<script setup lang="ts">
import type { UploadInstance, UploadUserFile } from 'element-plus';

import { nextTick, reactive, ref } from 'vue';

import { ElMessage } from 'element-plus';

import { fileUploadApi } from '#/api/system/media/file';

const emit = defineEmits<{ (e: 'success'): void }>();

const uploadRef = ref<UploadInstance>();

// 数组形式存储用户上传的多文件
let uploadFiles = reactive<UploadUserFile[]>([]);

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

// 打开上传文件窗口
function openDialog() {
  dialog.visible = true;
}

// 关闭上传文件窗口
function closeDialog() {
  // 清空已上传的文件引用
  uploadFiles = [];
  uploadRef.value?.clearFiles();
  dialog.visible = false;
}

// 上传文件
const submitUpload = () => {
  if (uploadFiles.length === 0) {
    ElMessage.error('上传文件不能为空');
    return false;
  }
  Promise.all(
    uploadFiles.map((uploadFile) => {
      return fileUploadApi(uploadFile.raw);
    }),
  ).then(() => {
    ElMessage.success('文件上传成功');
    emit('success');
    // 清空已上传的文件引用
    closeDialog();
  });
};

defineExpose({ openDialog });
</script>
<template>
  <el-dialog
    v-model="dialog.visible"
    title="上传文件"
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
    </el-upload>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog()">取消</el-button>
        <el-button type="primary" @click="submitUpload()">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
