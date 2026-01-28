<script setup lang="ts">
import type { UploadInstance, UploadUserFile } from 'element-plus';

import { nextTick, reactive, ref } from 'vue';

import { ElMessage } from 'element-plus';

import { uploadImageApi } from '#/api/system/files/image';

const emit = defineEmits<{ (e: 'success'): void }>();

const uploadRef = ref<UploadInstance>();

// 数组形式存储用户上传的多图片
let uploadFiles = reactive<UploadUserFile[]>([]);

function handleFileExceed(files: any[]) {
  const excessFiles = files.slice(1); // 仅保留超出的图片
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

// 删除上传列表的图片
async function handleRemove(uploadFile: UploadUserFile) {
  // 比较图片uid。上传图片的uid和删除图片的uid是否一样
  const index = uploadFiles.findIndex(
    (file) => file.raw.uid === uploadFile.uid,
  );

  // uid相同就可以删除
  if (index === -1) {
    ElMessage.error('图片未找到，无法删除');
  } else {
    // 从上传列表图片中移除图片
    uploadFiles.splice(index, 1);
    // 等待DOM更新后再显示信息
    await nextTick();
    ElMessage.success('图片已从上传列表移除');
  }
}

// 只接受图片文件
function beforeUpload(uploadFile: UploadUserFile) {
  const isImage = [
    'image/gif',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ].includes(uploadFile.type);
  if (!isImage) {
    ElMessage.error('上传文件只能是图片格式!');
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
  uploadRef.value?.clearFiles();
  dialog.visible = false;
}

// 上传图片
const submitUpload = () => {
  if (uploadFiles.length === 0) {
    ElMessage.error('上传图片不能为空');
    return false;
  }
  Promise.all(
    uploadFiles.map((uploadFile) => {
      return uploadImageApi(uploadFile.raw);
    }),
  ).then(() => {
    ElMessage.success('图片上传成功');
    emit('success');
    // 清空已上传的图片引用
    closeDialog();
  });
};

defineExpose({ openUploadDialog });
</script>
<template>
  <el-dialog
    v-model="dialog.visible"
    :title="dialog.title"
    width="800"
    center
    @close="closeDialog()"
  >
    <el-upload
      class="upload-demo"
      drag
      ref="uploadRef"
      :file-list="uploadFiles"
      :on-exceed="handleFileExceed"
      :on-change="handleFileChange"
      :on-remove="handleRemove"
      :before-upload="beforeUpload"
      accept=".jpg,.jpeg,.png,.gif"
      :auto-upload="false"
      :multiple="true"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
    </el-upload>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog()">取消</el-button>
        <el-button type="primary" @click="submitUpload">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
