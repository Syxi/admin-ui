<script setup lang="ts">
import type { ImageForm } from '#/api/system/media/image';

import { reactive, ref } from 'vue';

import { NModal, NForm, NFormItem, NInput, NButton } from 'naive-ui';
import { message } from '#/hooks';

import { getImageDetailsApi, updateImageApi } from '#/api/system/media/image';

const imageFormRef = ref();

const loading = ref(false);

const dialog = reactive({
  title: '',
  visible: false,
});

const formData = reactive<ImageForm>({});

/**
 * 打开弹窗
 * @param id
 */
async function openDialog(id?: string) {
  dialog.visible = true;
  if (id) {
    dialog.title = '修改图片';
    const data = await getImageDetailsApi(id);
    Object.assign(formData, data);
  }
}

/**
 * 关闭预览弹窗
 */
function closeDialog() {
  dialog.visible = false;
}

/**
 * 提交更新图片信息
 */
async function handleSubmit() {
  try {
    loading.value = true;
    await updateImageApi(formData);
    message.success('图片修改成功!');
  } catch {
    message.error('图片修改失败!');
  } finally {
    loading.value = false;
    closeDialog();
  }
}

defineExpose({ openDialog });
</script>
<template>
  <NModal
    v-model:show="dialog.visible"
    :title="dialog.title"
    :show-icon="false"
    preset="dialog"
    style="width: 400px;"
    @close="closeDialog()"
  >
    <NForm ref="imageFormRef" :model="formData">
      <NFormItem label="图片名称">
        <NInput v-model:value="formData.imageName" />
      </NFormItem>
    </NForm>

    <template #action>
      <div class="dialog-footer">
        <NButton @click="closeDialog">取消</NButton>
        <NButton type="primary" @click="handleSubmit">确定</NButton>
      </div>
    </template>
  </NModal>
</template>