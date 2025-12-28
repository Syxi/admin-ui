<script setup lang="ts">
import type { ArticlePage, ArticleQuery } from '#/api/system/article/article';
import type { CategoryOption } from '#/api/system/article/category';

import { h, onMounted, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NButton, NDataTable, NPagination, NIcon, NSpace, NSelect, NTag } from 'naive-ui';
import { message, dialog } from '#/hooks';

import {
  deleteArticleApi,
  selectArticlePageApi,
} from '#/api/system/article/article';
import { selectCategoryOptionApi } from '#/api/system/article/category';
import { useCardHeight } from '#/hooks/useCardHeight';
import ArticleFormDrawer from '#/views/system/article/article/ArticleFormDrawer.vue';
import {useTableHeight} from "#/hooks/useTableHeight";
import { Search, Refresh, Plus, Delete, Edit } from '@vben/icons';

defineOptions({
  name: 'Article',
  inheritAttrs: false,
});

const queryFormRef = ref();

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
  queryFormRef.value?.restoreValidation();
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
    message.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  dialog.warning({
    title: '警告',
    content: '确定删除已选中的数据项?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      deleteArticleApi(articleIds).then(() => {
        message.success('删除成功');
        resetQuery();
      });
    }
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
      <NForm ref="queryFormRef" :model="queryParams" :inline="true">
        <NFormItem prop="title">
          <NInput
            v-model:value="queryParams.title"
            placeholder="文章标题"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery()"
          />
        </NFormItem>

        <NFormItem>
          <NSelect
            v-model:value="queryParams.categoryName"
            placeholder="文章分类"
            style="width: 150px"
            clearable
            @update:value="handleQuery()"
            :options="categoryList"
          />
        </NFormItem>

        <NFormItem>
          <NSelect
            v-model:value="queryParams.publish"
            placeholder="文章状态"
            style="width: 150px"
            clearable
            @update:value="handleQuery()"
            :options="publishOptions"
          />
        </NFormItem>

        <NFormItem>
          <NButton type="primary" @click="handleQuery()">
            <template #icon>
              <NIcon><Search /></NIcon>
            </template>
            搜索
          </NButton>

          <NButton type="primary" @click="resetQuery()">
            <template #icon>
              <NIcon><Refresh /></NIcon>
            </template>
            重置
          </NButton>

          <NButton
            type="primary"
            @click="openDialog()"
            v-access:code="['article:add']"
          >
            <template #icon>
              <NIcon><Plus /></NIcon>
            </template>
            新增
          </NButton>

          <NButton
            type="error"
            @click="handleDelete()"
            v-access:code="['article:delete']"
          >
            <template #icon>
              <NIcon><Delete /></NIcon>
            </template>
            删除
          </NButton>
        </NFormItem>
      </NForm>

      <NDataTable
        v-model:checked-row-keys="ids"
        :loading="loading"
        :data="articleTableData"
        :columns="[
          {
            type: 'selection',
            width: 55,
            align: 'center'
          },
          {
            title: '标题',
            key: 'title',
            align: 'center'
          },
          {
            title: '文章分类',
            key: 'categoryName',
            align: 'center'
          },
          {
            title: '文章简介',
            key: 'introduction',
            align: 'center'
          },
          {
            title: '作者',
            key: 'author',
            align: 'center'
          },
          {
            title: '阅读量',
            key: 'readCount',
            align: 'center',
            width: 80
          },
          {
            title: '排序',
            key: 'sort',
            align: 'center',
            width: 80
          },
          {
            title: '发布状态',
            key: 'publish',
            align: 'center',
            render: (row) => {
              return row.publish === 1 
                ? h(NTag, { type: 'success' }, { default: () => '发布' })
                : h(NTag, { type: 'info' }, { default: () => '未发布' });
            }
          },
          {
            title: '置顶',
            key: 'top',
            align: 'center',
            render: (row) => {
              return row.top === 1 
                ? h(NTag, { type: 'success' }, { default: () => '置顶' })
                : h(NTag, { type: 'info' }, { default: () => '未置顶' });
            }
          },
          {
            title: '创建时间',
            key: 'createTime',
            align: 'center'
          },
          {
            title: '操作',
            key: 'actions',
            align: 'center',
            width: 300,
            render: (row) => {
              return h(NSpace, null, {
                default: () => [
                  h(NButton, {
                    type: 'primary',
                    size: 'small',
                    quaternary: true,
                    onClick: () => openDialog(row.articleId)
                  }, { default: () => '编辑' }),
                  h(NButton, {
                    type: 'error',
                    size: 'small',
                    quaternary: true,
                    onClick: () => handleDelete(row.articleId)
                  }, { default: () => '删除' })
                ]
              });
            }
          }
        ]"
        :pagination="{
          page: queryParams.page,
          pageSize: queryParams.limit,
          itemCount: total,
          showSizePicker: true,
          pageSizes: [10, 20, 30, 40, 50, 100],
          onUpdatePage: (page) => {
            queryParams.page = page;
            handleQuery();
          },
          onUpdatePageSize: (pageSize) => {
            queryParams.limit = pageSize;
            queryParams.page = 1;
            handleQuery();
          }
        }"
      />

    <ArticleFormDrawer ref="articleFormDrawerRef" @success="handleQuery" />
  </div>
</template>