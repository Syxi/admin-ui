<script setup lang="ts">
import type { ArticleForm } from '#/api/system/article/article';
import type { CategoryOption } from '#/api/system/article/category';

import { reactive, ref } from 'vue';

import { NDrawer, NForm, NFormItem, NInput, NSelect, NInputNumber, NRadioGroup, NRadio, NButton } from 'naive-ui';
import { message } from '#/hooks';

import {
  getArticleDetailApi,
  saveArticleApi,
  updateArticleApi,
} from '#/api/system/article/article';
import { WangEditor } from '#/components/wang-editor';

const emit = defineEmits<{ (e: 'success'): void }>();

const loading = ref(false);

const dataFormRef = ref();

const formData = reactive<ArticleForm>({});

const dialog = reactive({
  title: '',
  visible: false,
});

const rules = reactive({
  title: [{ required: true, message: '请输入文章标题', trigger: ['blur'] }],
});

// 文章分类数组
const categoryList = ref<CategoryOption[]>([]);

/**
 * 打开弹窗
 * @param categoryData
 * @param articleId
 */
async function openDialog(categoryData: CategoryOption[], articleId?: string) {
  categoryList.value = categoryData || [];

  if (articleId) {
    dialog.visible = true;
    dialog.title = '修改文章';
    const data = await getArticleDetailApi(articleId);
    Object.assign(formData, data);
  } else {
    dialog.visible = true;
    dialog.title = '新增文章';
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
  formData.articleId = undefined;
}

/**
 * 提交表单
 */
async function handleSubmit() {
  try {
    await dataFormRef.value?.validate();
    loading.value = true;
    const id = formData.articleId;

    await (id ? updateArticleApi(formData) : saveArticleApi(formData));
    message.success(id ? '修改成功' : '新增成功');
    emit('success');
    closeDialog();
  } finally {
    loading.value = false;
  }
}

defineExpose({ openDialog });
</script>
<template>
  <NDrawer
    v-model:show="dialog.visible"
    @close="closeDialog()"
    :width="500"
  >
    <template #header>
      <div class="flex justify-center">
        <h1>{{ dialog.title }}</h1>
      </div>
    </template>
    <NForm
      ref="dataFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <!-- <NFormItem label="文章封面：" prop="avatar"></NFormItem> -->

      <NFormItem label="文章标题：" path="title" :show-require-mark="true">
        <NInput v-model:value="formData.title" placeholder="请输入文章标题" />
      </NFormItem>

      <NFormItem label="文章分类：" path="categoryName">
        <NSelect
          v-model:value="formData.categoryName"
          placeholder="文章分类"
          style="width: 200px"
          :options="categoryList"
        />
      </NFormItem>

      <NFormItem label="作者：" path="author">
        <NInput v-model:value="formData.author" placeholder="请输入作者名称" />
      </NFormItem>

      <NFormItem label="排序：" path="sort">
        <NInputNumber v-model:value="formData.sort" style="width: 200px" />
      </NFormItem>

      <NFormItem label="文章简介：" path="introduction">
        <NInput
          v-model:value="formData.introduction"
          placeholder="请输入文章简介"
          type="textarea"
          :rows="4"
        />
      </NFormItem>

      <div>
        <NFormItem label="是否发布：" path="publish">
          <NRadioGroup v-model:value="formData.publish">
            <NRadio :value="1">发布</NRadio>
            <NRadio :value="-1">未发布</NRadio>
          </NRadioGroup>
        </NFormItem>
      </div>

      <NFormItem label="是否置顶：" path="top">
        <NRadioGroup v-model:value="formData.top">
          <NRadio :value="1">置顶</NRadio>
          <NRadio :value="-1">未置顶</NRadio>
        </NRadioGroup>
      </NFormItem>

      <NFormItem label="文章内容：" path="content">
        <WangEditor
          v-model:model-value="formData.content"
          placeholder="请输入文章内容"
        />
      </NFormItem>
      <!-- </el-row> -->
    </NForm>

    <template #footer>
      <div class="flex justify-center">
        <NButton type="primary" @click="closeDialog()">取消</NButton>
        <NButton type="primary" @click="handleSubmit()">确定</NButton>
      </div>
    </template>
  </NDrawer>
</template>