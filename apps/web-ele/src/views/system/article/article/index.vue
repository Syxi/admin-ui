<script setup lang="ts">
import type { ArticlePage, ArticleQuery } from '#/api/system/article/article';
import type { CategoryOption } from '#/api/system/article/category';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  deleteArticleApi,
  selectArticlePageApi,
} from '#/api/system/article/article';
import { selectCategoryOptionApi } from '#/api/system/article/category';

import ArticleFormDrawer from '#/views/system/article/article/ArticleFormDrawer.vue';
import {useTableHeight} from "#/hooks/useTableHeight";

defineOptions({
  name: 'Article',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const loading = ref(false);

const ids = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<ArticleQuery>({
  page: 1,
  limit: 20,
});

const articleTableData = ref<ArticlePage[]>();

// 文章分类数组
const categoryList = ref<CategoryOption[]>([]);

function getCategoryList() {
  selectCategoryOptionApi().then((data) => {
    categoryList.value = data;
  });
}

// 文章发布选项
const publishOptions = reactive([
  { label: '已发布', value: 1 },
  { label: '未发布', value: -1 },
]);

// 查询
function handleQuery() {
  loading.value = true;
  selectArticlePageApi(queryParams)
    .then((data) => {
      articleTableData.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

/**
 * 重置查询
 */
function resetQuery() {
  queryFormRef.value.resetFields();
  queryParams.title = '';
  queryParams.categoryName = '';
  queryParams.publish = undefined;
  queryParams.page = 1;
  handleQuery();
}


/**
 * 行复选框选中
 * @param selection
 */
function handleSelectionChange(selection: any) {
  ids.value = selection.map((item: any) => item.articleId);
}

function handleDelete(articleId?: string) {
  let articleIds: string[];
  if (articleId) {
    articleIds = [String(articleId)]; // 删除单条记录
  } else if (ids.value.length > 0) {
    articleIds = ids.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteArticleApi(articleIds).then(() => {
      ElMessage.success('删除成功');
      resetQuery();
    });
  });
}

onMounted(() => {
  handleQuery();
  getCategoryList();
});

const { tableHeight } = useTableHeight(queryFormRef);

// 新增、修改文章表单子组件
const articleFormDrawerRef = ref();
function openDialog(id?: string) {
  articleFormDrawerRef.value.openDialog(id, categoryList.value);
}
</script>

<template>
  <div class="app-container">
      <ElForm ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="文章标题"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery()"
          />
        </el-form-item>

        <el-form-item>
          <el-select
            v-model="queryParams.categoryName"
            placeholder="文章分类"
            style="width: 150px"
            clearable
            @change="handleQuery()"
          >
            <el-option
              v-for="item in categoryList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-select
            v-model="queryParams.publish"
            placeholder="文章状态"
            style="width: 150px"
            clearable
            @change="handleQuery()"
          >
            <el-option
              v-for="item in publishOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery()">
            <template #icon>
              <el-icon><Search /></el-icon>
            </template>
            搜索
          </el-button>

          <el-button type="primary" @click="resetQuery()">
            <template #icon>
              <el-icon><Refresh /></el-icon>
            </template>
            重置
          </el-button>

          <el-button
            type="primary"
            @click="openDialog()"
            v-access:code="['article:add']"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>

          <el-button
            type="danger"
            @click="handleDelete()"
            v-access:code="['article:delete']"
          >
            <template #icon>
              <el-icon><Delete /></el-icon>
            </template>
            删除
          </el-button>
        </el-form-item>
      </ElForm>

      <el-table
        v-loading="loading"
        heighlight-current-row
        :data="articleTableData"
        border
        :height="tableHeight"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />

        <!-- <el-table-column
            label="文章封面图片"
            prop="avatar"
            align="center"
          >
          <template slot-scope="scope">
            <img :src="scope.row.avatar" width="50" height="50" />
          </template>
          </el-table-column> -->

        <el-table-column label="标题" prop="title" align="center" />

        <el-table-column label="文章分类" prop="categoryName" align="center" />

        <el-table-column label="文章简介" prop="introduction" align="center" />

        <el-table-column label="作者" prop="author" align="center" />

        <el-table-column
          label="阅读量"
          prop="readCount"
          align="center"
          width="80"
        />

        <el-table-column label="排序" prop="sort" align="center" width="80" />

        <el-table-column label="发布状态" prop="publish" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.publish === 1" type="success">发布</el-tag>
            <el-tag v-else type="info">未发布</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="置顶" prop="top" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.top === 1" type="success">置顶</el-tag>
            <el-tag v-else type="info">未置顶</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createTime" align="center" />

        <el-table-column label="操作" align="center" width="300">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              v-access:code="['article:edit']"
              @click.stop="openDialog(scope.row.articleId)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              v-access:code="['article:delete']"
              type="primary"
              link
              size="small"
              @click.stop="handleDelete(scope.row.articleId)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :total="total"
        :page-sizes="[10, 20, 30, 40, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
      />

    <ArticleFormDrawer ref="articleFormDrawerRef" @success="handleQuery" />
  </div>
</template>
