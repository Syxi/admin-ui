<script setup lang="ts">
import {reactive, ref} from "vue";
import { NModal, NForm, NFormItem, NInput, NInputNumber, NButton } from 'naive-ui';
import { message } from '#/hooks';
import {
  type CategoryForm,
  getCategoryDetailApi, saveCategoryApi,
  updateCategoryApi
} from "#/api/system/article/category";

const emit = defineEmits<{ (e: 'success'): void }>();

const dataFormRef = ref();

const formData = reactive<CategoryForm>({});

const dialog = reactive({
  title: '',
  visible: false,
});

const rules = reactive({
  categoryName: [
    { required: true, message: '请输入文章分类名称', trigger: ['blur'] },
  ],
});

/**
 * 打开弹窗
 * @param categoryId
 */
async function openDialog(categoryId?: string) {
  dialog.visible = true;
  if (categoryId) {
    dialog.title = '修改文章分类';
    const data = await getCategoryDetailApi(categoryId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增文章分类';
  }
}

/**
 * 关闭弹窗
 */
function closeDialog() {
  dialog.visible = false;
  resetForm();
}

/**
 * 重置表单
 */
function resetForm() {
  dataFormRef.value?.restoreValidation();
}

/**
 * 提交表单
 */
async function handleSubmit() {
  try {
    await dataFormRef.value?.validate();
    const id = formData.categoryId;
    await (id ? updateCategoryApi(formData) : saveCategoryApi(formData));
    message.success(id ? '修改成功' : '新增成功');
    emit('success');
    closeDialog();
  } catch (error) {
    // 验证失败或其他错误
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
    <NForm
      ref="dataFormRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      :inline="true"
    >
      <NFormItem label="文章分类名称" path="categoryName" :show-require-mark="true">
        <NInput
          v-model:value="formData.categoryName"
          placeholder="请输入文章分类名称"
        />
      </NFormItem>

      <div>
        <NFormItem label="排序" path="sort">
          <NInputNumber v-model:value="formData.sort" style="width: 200px" />
        </NFormItem>
      </div>
    </NForm>
    <template #action>
      <div class="dialog-footer">
        <NButton type="primary" @click="closeDialog()">取消</NButton>
        <NButton type="primary" @click="handleSubmit()">确定</NButton>
      </div>
    </template>
  </NModal>
</template>