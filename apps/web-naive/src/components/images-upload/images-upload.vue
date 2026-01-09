<!-- 多图片上传组件 -->
<script setup lang="ts">
import { ref } from 'vue';

import { useVModel } from '@vueuse/core';
import { NUpload, NIcon, NModal, useMessage } from 'naive-ui';

import { uploadImagesApi } from '#/api/system/media/image';

const message = useMessage();

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
async function uploadFiles(option: { file: File }) {
  const urls = await uploadImagesApi([option.file as File]);
  console.log('Upload', urls);
  urls.forEach((url) => {
    const imgUrl = `${import.meta.env.VITE_APP_BASE_API}${url}`;
    imgUrlList.value.push({ url: imgUrl });
  });
}

/**
 * 限制用户上传文件的格式和大小
 */
function handleBeforeUpload(file: { file: File }) {
  if (file.file.size > 5 * 1048 * 1048) {
    message.warning('上传图片不能大于5M');
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
  <NUpload
    v-model:file-list="imgUrlList"
    list-type="image-card"
    :on-preview="HandlePreviewPiture"
    :before-upload="handleBeforeUpload"
    :custom-request="uploadFiles"
    :max="100"
  >
    <NIcon class="avatar-uploader-icon"><Plus /></NIcon>
  </NUpload>

  <NModal v-model:show="dialogVisible">
    <img :src="dialogImgUrl" />
  </NModal>
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
