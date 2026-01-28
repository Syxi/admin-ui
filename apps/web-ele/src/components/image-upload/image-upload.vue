<!-- 单图片上传组件 -->
<script setup lang="ts">
import type { UploadRawFile, UploadRequestOptions } from 'element-plus';

import { useVModel } from '@vueuse/core';
import { ElMessage } from 'element-plus';

import { uploadImageApi } from '#/api/system/files/image';

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
async function uploadFile(options: UploadRequestOptions): Promise<any> {
  const url = await uploadImageApi(options.file);
  imgUrl.value = `${import.meta.env.VITE_GLOB_API_URL}${url}`;
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
</script>

<template>
  <el-upload
    v-model="imgUrl"
    accept=".jpg,.jpeg,.png,.gif"
    :show-file-list="false"
    :before-upload="handleBeforeUpload"
    :http-request="uploadFile"
  >
    <div>
      <div>
<!--        <el-image :src="imgUrl" class="avatar" />-->
        <el-avatar shape="circle" :src="imgUrl" :size="140" fit="cover" />
      </div>
      <div class="mt-2 flex justify-center">
        <el-text><el-icon class="mr-1"><Camera /></el-icon>上传头像</el-text>
      </div>
    </div>
  </el-upload>
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
