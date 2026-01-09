<script setup lang="ts">
import type {
  CategoryPage,
  CategoryQuery,
} from '#/api/system/article/category';

import { h, onMounted, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NButton, NDataTable, NPagination, NIcon, NSpace, NCard } from 'naive-ui';
import { message, dialog } from '#/hooks';

import {
  deleteCategoryApi,
  selectCategoryPageApi,
} from '#/api/system/article/category';
import {useCardHeight} from "#/hooks/useCardHeight";
import CategoryFormDialog from "#/views/system/article/category/CategoryFormDialog.vue";
import {useTableHeight} from "#/hooks/useTableHeight";
import { Icon } from '@iconify/vue';

defineOptions({
  name: 'Category',
  inheritAttrs: false,
});

const queryFormRef = ref();

const loading = ref(false);

const ids = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<CategoryQuery>({
  page: 1,
  limit: 20,
});

const categoryTableData = ref<CategoryPage[]>();

// 查询
function handleQuery() {
  loading.value = true;
  selectCategoryPageApi(queryParams)
    .then((data) => {
      categoryTableData.value = data.list;
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
  queryParams.page = 1;
  handleQuery();
}


/**
 * 行复选框选中
 * @param selection
 */
function handleSelectionChange(selection: any) {
  ids.value = selection.map((item: any) => item.categoryId);
}


function handleDelete(categoryId?: string) {
  let categoryIds: string[];
  if (categoryId) {
    categoryIds = [String(categoryId)]; // 删除单条记录
  } else if (ids.value.length > 0) {
    categoryIds = ids.value; // 删除多条记录
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
      deleteCategoryApi(categoryIds).then(() => {
        message.success('删除成功');
        resetQuery();
      });
    }
  });
}

onMounted(() => {
  handleQuery();
});

const { tableHeight } = useTableHeight(queryFormRef);

// 新增、编辑对话框子组件
const categoryFormDialogRef = ref();
function openDialog(categoryId?: string) {
  categoryFormDialogRef.value.openDialog(categoryId);
}
</script>

<template>
  <div class="app-container">
      <NForm ref="queryFormRef" :model="queryParams" :inline="true">
        <NFormItem prop="categoryName">
          <NInput
            v-model:value="queryParams.categoryName"
            placeholder="文章分类名称"
            clearable
            @keyup.enter="handleQuery()"
          />
        </NFormItem>

        <NFormItem>
          <NButton type="primary" @click="handleQuery()">
            <template #icon>
              <NIcon><Icon icon="mdi:magnify" /></NIcon>
            </template>
            搜索
          </NButton>

          <NButton type="primary" @click="resetQuery()">
            <template #icon>
              <NIcon><Icon icon="mdi:refresh" /></NIcon>
            </template>
            重置
          </NButton>

          <NButton
            type="primary"
            @click="openDialog()"
            v-access:code="['category:add']"
          >
            <template #icon>
              <NIcon><Icon icon="mdi:plus" /></NIcon>
            </template>
            新增
          </NButton>

          <NButton
            type="error"
            @click="handleDelete()"
            v-access:code="['category:delete']"
          >
            <template #icon>
              <NIcon><Icon icon="mdi:delete" /></NIcon>
            </template>
            删除
          </NButton>
        </NFormItem>
      </NForm>

      <NDataTable
        v-model:checked-row-keys="ids"
        :loading="loading"
        :data="categoryTableData"
        :columns="[
          {
            type: 'selection',
            width: 55,
            align: 'center'
          },
          {
            title: '文章分类名称',
            key: 'categoryName',
            align: 'center'
          },
          {
            title: '文章量',
            key: 'articleCount',
            align: 'center'
          },
          {
            title: '排序',
            key: 'sort',
            align: 'center'
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
                    onClick: () => openDialog(row.categoryId)
                  }, { default: () => '编辑' }),
                  h(NButton, {
                    type: 'error',
                    size: 'small',
                    quaternary: true,
                    onClick: () => handleDelete(row.categoryId)
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

    <CategoryFormDialog ref="categoryFormDialogRef" @success="resetQuery" />
  </div>
</template>