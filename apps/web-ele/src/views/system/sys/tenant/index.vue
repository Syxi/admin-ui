<script setup lang="ts">
import type { TenantPage, TenantQuery } from '#/api/system/sys/tenant';

import { onMounted, reactive, ref } from 'vue';

import {
  Delete,
  Edit,
  Plus,
  Refresh,
} from '@element-plus/icons-vue';
import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  deleteTenantApi,
  selectTenantPageApi,
} from '#/api/system/sys/tenant';
import { useCardHeight } from '#/hooks/useCardHeight';
import TenantFormDialog from '#/views/system/sys/tenant/TenantFormDialog.vue';
import TenantUserDialog from '#/views/system/sys/tenant/TenantUserDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";

defineOptions({
  name: 'Tenant',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const loading = ref(false);

const tenantIds = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<TenantQuery>({
  page: 1,
  limit: 20,
});

const tenantTableData = ref<TenantPage[]>();

// 租户表单组件
const tenantFormDialogRef = ref();
/**
 * 打开租户表单弹窗
 */
function openTenantDialog(id?: string) {
  tenantFormDialogRef.value.open(id);
}

// 租户菜单组件
const tenantMenuDialogRef = ref();

/**
 * 打开租户菜单弹窗
 * @param id
 * @param tenantName
 */
function openTenantMenuDrawer(id: string, tenantName: string) {
  tenantMenuDialogRef.value.openMenuDialog(id, tenantName);
}

// 租户用户组件
const tenantUserDialogRef = ref();

/**
 * 打开租户分配用户弹窗
 * @param id
 * @param tenantName
 */
function openTenantUserDialog(id: string, tenantName: string) {
  tenantUserDialogRef.value.openUserDialog(id, tenantName);
}

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  // 多选的tenantIds
  tenantIds.value = selection.map((item: any) => item.id);
}

/**
 * 查询租户
 */
function handleQuery() {
  loading.value = true;
  selectTenantPageApi(queryParams)
    .then((data) => {
      tenantTableData.value = data.list;
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
 * 删除租户
 * @param id
 */
function handleDelete(id?: string) {
  let ids: string[];
  if (id) {
    ids = [String(id)]; // 删除单条记录
  } else if (tenantIds.value.length > 0) {
    ids = tenantIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    loading.value = true;
    deleteTenantApi(ids)
      .then(() => {
        ElMessage.success('删除成功');
        resetQuery();
      })
      .finally(() => {
        loading.value = false;
      });
  });
}

const { tableHeight } = useTableHeight(queryFormRef);

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div class="app-container">
      <ElForm
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        @submit.prevent
      >
        <el-form-item prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="租户名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <template #icon>
              <el-icon><Search /></el-icon>
            </template>
            搜索
          </el-button>

          <el-button type="primary" @click="resetQuery">
            <template #icon>
              <el-icon><Refresh /></el-icon>
            </template>
            重置
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:tenant:add']"
            @click="openTenantDialog()"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>

          <el-button
            type="danger"
            :disabled="tenantIds.length === 0"
            v-access:code="['sys:tenant:delete']"
            @click="handleDelete()"
          >
            <template #icon>
              <el-icon><Delete /></el-icon>
            </template>
            删除
          </el-button>
        </el-form-item>
      </ElForm>
      <el-table
        ref="dataTableRef"
        v-loading="loading"
        :data="tenantTableData"
        highlight-current-row
        :border="true"
        @selection-change="handleSelectionChange"
        :default-sort="{ prop: 'sort', order: 'ascending' }"
        :height="tableHeight"
      >
        <el-table-column type="selection" width="80" align="center" />
        <el-table-column type="index" width="80" align="center" label="序号" />

        <el-table-column
          label="租户名称"
          prop="name"
          width="200"
          align="center"
        />

        <el-table-column
          label="租户编码"
          prop="code"
          width="200"
          align="center"
        />

        <el-table-column label="状态" prop="status" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="排序"
          sortable="custom"
          prop="sort"
          width="100"
          align="center"
        />

        <el-table-column
          label="创建时间"
          prop="createTime"
          width="200"
          align="center"
          sortable="custom"
        />

        <el-table-column
          label="更新时间"
          prop="updateTime"
          width="200"
          align="center"
          sortable="custom"
        />

        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              @click="openTenantUserDialog(scope.row.id, scope.row.name)"
              v-access:code="['sys:tenant:user:add']"
            >
              <el-icon><User /></el-icon>分配用户
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:tenant:edit']"
              @click="openTenantDialog(scope.row.id)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:tenant:delete']"
              @click="handleDelete(scope.row.id)"
            >
              <el-icon><Delete /></el-icon>删除
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

    <TenantFormDialog ref="tenantFormDialogRef" @success="handleQuery" />

    <TenantUserDialog ref="tenantUserDialogRef" @success="resetQuery" />
  </div>
</template>
