<script setup lang="ts">
import type {
  CategoryPage,
  CategoryQuery,
} from '#/api/system/article/category';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  deleteCategoryApi,
  selectCategoryPageApi,
} from '#/api/system/article/category';

import CategoryFormDialog from "#/views/system/article/category/CategoryFormDialog.vue";
import {useTableHeight} from "#/hooks/useTableHeight";

defineOptions({
  name: 'Category',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

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
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteCategoryApi(categoryIds).then(() => {
      ElMessage.success('删除成功');
      resetQuery();
    });
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
      <ElForm ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item prop="categoryName">
          <el-input
            v-model="queryParams.categoryName"
            placeholder="文章分类名称"
            clearable
            @keyup.enter="handleQuery()"
          />
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
            v-access:code="['category:add']"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>

          <el-button
            type="danger"
            @click="handleDelete()"
            v-access:code="['category:delete']"
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
        :data="categoryTableData"
        border
        :height="tableHeight"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />

        <!-- <el-table-column
            label="图标"
            prop="icon"
            align="center"
          /> -->

        <el-table-column
          label="文章分类名称"
          prop="categoryName"
          align="center"
        />

        <el-table-column label="文章量" prop="articleCount" align="center" />

        <el-table-column label="排序" prop="sort" align="center" />

        <el-table-column label="创建时间" prop="createTime" align="center" />

        <el-table-column label="操作" align="center" width="300">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              v-access:code="['category:edit']"
              @click.stop="openDialog(scope.row.categoryId)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              v-access:code="['category:delete']"
              type="primary"
              link
              size="small"
              @click.stop="handleDelete(scope.row.categoryId)"
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

    <CategoryFormDialog ref="categoryFormDialogRef" @success="resetQuery" />
  </div>
</template>
