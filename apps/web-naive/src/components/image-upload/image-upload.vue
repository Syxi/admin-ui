<!-- 单图片上传组件 -->
<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import { NUpload, NAvatar, NText, NIcon, useMessage } from 'naive-ui';

import { uploadImageApi } from '#/api/system/media/image';

const message = useMessage();

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);
const imgUrl = useVModel(props, 'modelValue', emit);

/**
 * 自定义图片上传
 *
 * @param options
 */
async function uploadFile(options: { file: File }): Promise<any> {
  const url = await uploadImageApi(options.file as File);
  imgUrl.value = `${import.meta.env.VITE_GLOB_API_URL}${url}`;
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
</script>

<template>
  <NUpload
    :accept="'.jpg,.jpeg,.png,.gif'"
    :show-file-list="false"
    :before-upload="handleBeforeUpload"
    :custom-request="uploadFile"
    :max-count="1"
  >
    <NAvatar shape="circle" :src="imgUrl" :size="140" fit="cover" />
    <div class="mt-2 flex justify-center">
      <NText>上传头像</NText>
    </div>
  </NUpload>
</template>

<style scoped lang="scss">
.avatar {
  height: 150px;
  width: 150px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #dfdfdf;
}
</style>
