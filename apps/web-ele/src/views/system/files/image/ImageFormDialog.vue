<script setup lang="ts">
import type { ImageForm } from '#/api/system/files/image';

import { reactive, ref } from 'vue';

import { ElForm, ElMessage } from 'element-plus';

import { getImageDetailsApi, updateImageApi } from '#/api/system/files/image';

const imageFormRef = ref(ElForm);

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
    ElMessage.success('图片修改成功!');
  } catch {
    ElMessage.error('图片修改失败!');
  } finally {
    loading.value = false;
    closeDialog();
  }
}

defineExpose({ openDialog });
</script>
<template>
  <el-dialog
    v-model="dialog.visible"
    :title="dialog.title"
    draggable
    center
    width="400px"
    @close="closeDialog()"
  >
    <ElForm ref="imageFormRef" :model="formData">
      <el-form-item label="图片名称">
        <el-input v-model="formData.imageName" />
      </el-form-item>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
