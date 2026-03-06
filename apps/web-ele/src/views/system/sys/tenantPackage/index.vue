<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="套餐名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入套餐名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item label="套餐编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入套餐编码"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          clearable
          style="width: 240px"
        >
          <el-option :value="1" label="启用" />
          <el-option :value="-1" label="禁用" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <template #icon>
            <Search />
          </template>
          搜索
        </el-button>

        <el-button @click="resetQuery">
          <template #icon>
            <Refresh />
          </template>
          重置
        </el-button>
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          v-access:code="['sys:tenantPackage:add']"
          @click="openTenantPackageDialog()"
        >
          <template #icon>
            <el-icon><Plus /></el-icon>
          </template>
          新增
        </el-button>
          <el-button
            type="danger"
            :disabled="tenantPackageIds.length === 0"
            v-access:code="['sys:tenantPackage:delete']"
            @click="handleDelete()"
          >
            <template #icon>
              <el-icon><Delete /></el-icon>
            </template>
            删除
          </el-button>
      </el-form-item>
    </el-form>


    <!-- 数据表格 -->
    <el-table
      ref="dataTableRef"
      v-loading="loading"
      :data="tenantPackageTableData"
      highlight-current-row
      :border="true"
      @selection-change="handleSelectionChange"
      :default-sort="{ prop: 'sort', order: 'ascending' }"
      :height="tableHeight"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column type="index" width="50" align="center" label="序号" />

      <el-table-column
        label="套餐名称"
        prop="name"
        width="150"
        align="center"
        show-overflow-tooltip
      />

      <el-table-column
        label="套餐编码"
        prop="code"
        width="150"
        align="center"
        show-overflow-tooltip
      />

      <el-table-column
        label="套餐描述"
        prop="description"
        align="center"
        show-overflow-tooltip
      />

      <el-table-column
        label="最大用户数"
        prop="maxUsers"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          {{ row.maxUsers ? row.maxUsers : '-' }}
        </template>
      </el-table-column>

      <el-table-column
        label="最大存储空间(MB)"
        prop="maxStorage"
        width="150"
        align="center"
      >
        <template #default="{ row }">
          {{ row.maxStorage ? row.maxStorage : '-' }}
        </template>
      </el-table-column>

      <el-table-column
        label="有效期(天)"
        prop="validityDays"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          {{ row.validityDays ? row.validityDays : '-' }}
        </template>
      </el-table-column>

      <el-table-column label="状态" align="center" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">启用</el-tag>
          <el-tag v-else type="danger">禁用</el-tag>
        </template>
      </el-table-column>

      <el-table-column
        label="排序"
        prop="sort"
        width="80"
        align="center"
      />

      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
      >
        <template #default="{ row }">
          {{ row.createTime ? formatDateTime(row.createTime) : '-' }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="280" fixed="right" align="center">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            link
            v-access:code="['sys:tenantPackage:edit']"
            @click="openTenantPackageDialog(scope.row.id)"
          >
            <el-icon><Edit /></el-icon>编辑
          </el-button>

          <el-button
            type="primary"
            size="small"
            link
            v-access:code="['sys:tenantPackage:delete']"
            @click="handleDelete(scope.row.id)"
          >
            <el-icon><Delete /></el-icon>删除
          </el-button>

          <el-button
            type="success"
            size="small"
            link
            v-access:code="['sys:tenantPackage:assign']"
            @click="openTenantPackageAssignDialog(scope.row.id, scope.row.name)"
          >
            <el-icon><Key /></el-icon>租户授权
          </el-button>

          <el-button
            type="warning"
            size="small"
            link
            v-access:code="['sys:tenantPackage:menu']"
            @click="openTenantPackageMenuDialog(scope.row.id, scope.row.name)"
          >
            <el-icon><Menu /></el-icon>菜单授权
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

    <!-- 租户套餐表单组件 -->
    <TenantPackageFormDialog ref="tenantPackageFormDialogRef" @success="handleQuery" />

    <!-- 租户套餐授权组件 -->
    <TenantPackageAssignDialog ref="tenantPackageAssignDialogRef" @success="handleQuery" />

    <!-- 租户套餐菜单授权组件 -->
    <TenantPackageMenuDialog ref="tenantPackageMenuDialogRef" @success="handleQuery" />
  </div>
</template>

<script setup lang="ts">
import type { TenantPackagePage, TenantPackageQuery } from '#/api/system/sys/tenantPackage';

import { onMounted, reactive, ref } from 'vue';
import { Search, Refresh, Plus, Delete, Edit, Key, Menu } from '@element-plus/icons-vue';
import { ElForm, ElMessage, ElMessageBox } from 'element-plus';
import {
  deleteTenantPackageApi,
  selectTenantPackagePageApi,
} from '#/api/system/sys/tenantPackage';

import { useTableHeight } from '#/hooks/useTableHeight';
import { formatDateTime } from '@vben/utils';
import TenantPackageFormDialog from '#/views/system/sys/tenantPackage/TenantPackageFormDialog.vue';
import TenantPackageAssignDialog from '#/views/system/sys/tenantPackage/TenantPackageAssignDialog.vue';
import TenantPackageMenuDialog from '#/views/system/sys/tenantPackage/TenantPackageMenuDialog.vue';

defineOptions({
  name: 'TenantPackage',
  inheritAttrs: false,
});

const queryFormRef = ref();
const loading = ref(false);
const tenantPackageIds = ref<string[]>([]);
const total = ref(0);

const queryParams = reactive<TenantPackageQuery>({
  page: 1,
  limit: 20,
  name: '',
  code: '',
  status: undefined,
});

const { tableHeight } = useTableHeight(queryFormRef);

const tenantPackageTableData = ref<TenantPackagePage[]>();

// 租户套餐表单组件
const tenantPackageFormDialogRef = ref();

// 租户套餐授权组件
const tenantPackageAssignDialogRef = ref();

// 租户套餐菜单授权组件
const tenantPackageMenuDialogRef = ref();

/**
 * 打开租户套餐表单弹窗
 */
function openTenantPackageDialog(id?: string) {
  tenantPackageFormDialogRef.value.open(id);
}

/**
 * 打开租户套餐授权弹窗
 */
function openTenantPackageAssignDialog(packageId: string, packageName: string) {
  // 这里可以打开一个选择租户的对话框，或者直接调用授权接口
  // 为了演示，这里直接打开授权对话框
  // 在实际应用中，可能需要先选择要授权的租户
  ElMessage.info('请在租户管理页面进行套餐授权');
}

/**
 * 打开租户套餐菜单授权弹窗
 */
function openTenantPackageMenuDialog(id: string, name: string) {
  tenantPackageMenuDialogRef.value.open(id, name);
}

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  // 多选的tenantPackageIds
  tenantPackageIds.value = selection.map((item: any) => item.id);
}

/**
 * 查询租户套餐
 */
function handleQuery() {
  loading.value = true;
  selectTenantPackagePageApi(queryParams)
    .then((data) => {
      tenantPackageTableData.value = data.list;
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
 * 删除租户套餐
 * @param id
 */
function handleDelete(id?: string) {
  let ids: string[];
  if (id) {
    ids = [String(id)]; // 删除单条记录
  } else if (tenantPackageIds.value.length > 0) {
    ids = tenantPackageIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('是否确认删除选中的租户套餐数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      return deleteTenantPackageApi(ids.join(','));
    })
    .then(() => {
      ElMessage.success('删除成功');
      handleQuery();
    })
    .catch((error) => {
      // 用户取消了删除操作
    });
}

onMounted(() => {
  handleQuery();
});
</script>


