<script setup lang="ts">
import type { ArticleForm } from '#/api/system/article/article';

import { reactive, ref } from 'vue';

import { ElForm, ElMessage } from 'element-plus';

import {
  getArticleDetailApi,
  saveArticleApi,
  updateArticleApi,
} from '#/api/system/article/article';
import { WangEditor } from '#/components/wang-editor';

const emit = defineEmits<{ (e: 'success'): void }>();

const loading = ref(false);

const dataFormRef = ref(ElForm);

const formData = reactive<ArticleForm>({});

const dialog = reactive({
  title: '',
  visible: false,
});

const rules = reactive({
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
});

// 文章分类数组
const categoryList = ref<CategoryOption[]>([]);

/**
 * 打开弹窗
 * @param articleId
 * @param categoryData
 */
async function openDialog(articleId?: string, categoryData: CategoryOption[]) {
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
  dataFormRef.value.resetFields();
  dataFormRef.value.clearValidate();
  formData.articleId = undefined;
}

/**
 * 提交表单
 */
async function handleSubmit() {
  const valid = dataFormRef.value.validate();
  if (!valid) return;
  loading.value = true;
  const id = formData.articleId;

  await (id ? updateArticleApi(formData) : saveArticleApi(formData));
  ElMessage.success(id ? '修改成功' : '新增成功');
  emit('success');
  closeDialog();
  loading.value = false;
}

defineExpose({ openDialog });
</script>
<template>
  <el-drawer
    v-model="dialog.visible"
    :title="dialog.title"
    @close="closeDialog()"
    size="50%"
  >
    <ElForm
      ref="dataFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <!-- <el-form-item label="文章封面：" prop="avatar"></el-form-item> -->

      <el-form-item label="文章标题：" prop="title">
        <el-input v-model="formData.title" placeholder="请输入文章标题" />
      </el-form-item>

      <el-form-item label="文章分类：" prop="categoryName">
        <el-select
          v-model="formData.categoryName"
          placeholder="文章分类"
          style="width: 200px"
          clearable
        >
          <el-option
            v-for="item in categoryList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="作者：" prop="author">
        <el-input v-model="formData.author" placeholder="请输入作者名称" />
      </el-form-item>

      <el-form-item label="排序：" prop="sort">
        <el-input-number v-model="formData.sort" style="width: 200px" />
      </el-form-item>

      <el-form-item label="文章简介：" prop="introduction">
        <el-input
          v-model="formData.introduction"
          placeholder="请输入文章简介"
          type="textarea"
          :rows="4"
        />
      </el-form-item>

      <div>
        <el-form-item label="是否发布：" prop="publish">
          <el-radio-group v-model="formData.publish">
            <el-radio :value="1">发布</el-radio>
            <el-radio :value="-1">未发布</el-radio>
          </el-radio-group>
        </el-form-item>
      </div>

      <el-form-item label="是否置顶：" prop="top">
        <el-radio-group v-model="formData.top">
          <el-radio :value="1">置顶</el-radio>
          <el-radio :value="-1">未置顶</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="文章内容：" prop="content">
        <WangEditor
          v-model:model-value="formData.content"
          placeholder="请输入文章内容"
        />
      </el-form-item>
      <!-- </el-row> -->
    </ElForm>

    <template #footer>
      <div >
        <el-button type="primary" @click="closeDialog()">取消</el-button>
        <el-button type="primary" @click="handleSubmit()">确定</el-button>
      </div>
    </template>
  </el-drawer>
</template>
