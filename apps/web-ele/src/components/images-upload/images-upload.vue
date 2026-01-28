<!-- 多图片上传组件 -->
<script setup lang="ts">
import type { UploadRawFile, UploadRequestOptions } from 'element-plus';

import { ref } from 'vue';

import { useVModel } from '@vueuse/core';
import { ElMessage } from 'element-plus';

import { uploadImagesApi } from '#/api/system/files/image';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);
const imgUrlList = useVModel(props, 'modelValue', emit);

/**
 * 自定义图片上传
 *
 * @param options
 */
async function uploadFiles(option: UploadRequestOptions) {
  const urls = await uploadImagesApi([option.file]);
  console.log('Upload', urls);
  urls.forEach((url) => {
    const imgUrl = `${import.meta.env.VITE_APP_BASE_API}${url}`;
    imgUrlList.value.push({ imgUrl });
  });
}

/**
 * 限制用户上传文件的格式和大小
 */
function handleBeforeUpload(file: UploadRawFile) {
  if (file.size > 5 * 1048 * 1048) {
    ElMessage.warning('上传图片不能大于5M');
    return false;
  }
  return true;
}

const dialogVisible = ref(false);
const dialogImgUrl = ref('');

function HandlePreviewPiture(file: any) {
  dialogVisible.value = true;
  dialogImgUrl.value = `${import.meta.env.VITE_APP_BASE_API}${file.url}`;
}
</script>

<template>
  <el-upload
    v-model="imgUrlList"
    list-type="picture-card"
    :on-preview="HandlePreviewPiture"
    :before-upload="handleBeforeUpload"
    :http-request="uploadFiles"
    multiple
    :limit="100"
  >
    <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
  </el-upload>

  <el-dialog v-model="dialogVisible">
    <img :src="dialogImgUrl" />
  </el-dialog>
</template>

<style scoped lang="scss">
.single-uploader {
  overflow: hidden;
  cursor: pointer;
  border: 1px var(--el-border-color) solid;
  border-radius: 6px;

  &:hover {
    border-color: var(--el-color-primary);
  }

  &__image {
    display: block;
    width: 178px;
    height: 178px;
  }

  &___icon {
    width: 178px;
    height: 178px;
    font-size: 28px;
    color: #8c939d;
    text-align: center;
  }
}

.avatar-uploader-icon {
  width: 178px;
  height: 178px;
  font-size: 28px;
  color: #8c939d;
  text-align: center;
}
</style>
