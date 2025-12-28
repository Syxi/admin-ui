<script setup lang="ts">
import type { TenantPage, TenantQuery } from '#/api/system/sys/tenant';

import { onMounted, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NButton, NTable, NPopconfirm, NTag, NPagination, useMessage } from 'naive-ui';
import { Search, Refresh, Plus, Delete, Edit, User } from '@vben/icons';

import {
  deleteTenantApi,
  selectTenantPageApi,
} from '#/api/system/sys/tenant';
import TenantFormDialog from '#/views/system/sys/tenant/TenantFormDialog.vue';
import TenantUserDialog from '#/views/system/sys/tenant/TenantUserDialog.vue';

const message = useMessage();

defineOptions({
  name: 'Tenant',
  inheritAttrs: false,
});

const queryFormRef = ref();

const loading = ref(false);

const tenantIds = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<TenantQuery>({
  page: 1,
  limit: 20,
});

const tenantTableData = ref<TenantPage[]>();
const currentRow = ref();
const dataTableRef = ref();

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
    message.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  if (confirm('确定删除已选中的数据?')) {
    loading.value = true;
    deleteTenantApi(ids)
      .then(() => {
        message.success('删除成功');
        resetQuery();
      })
      .finally(() => {
        loading.value = false;
      });
  }
}

// 选择所有行
function selectAllRows() {
  if (tenantTableData.value) {
    tenantIds.value = tenantTableData.value.map(item => item.id);
  }
}

// 取消选择所有行
function unselectAllRows() {
  tenantIds.value = [];
}

// 选择单行
function selectRow(row: any) {
  if (!tenantIds.value.includes(row.id)) {
    tenantIds.value.push(row.id);
  }
}

// 取消选择单行
function unselectRow(row: any) {
  const index = tenantIds.value.indexOf(row.id);
  if (index > -1) {
    tenantIds.value.splice(index, 1);
  }
}

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div class="app-container">
      <NForm
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        @submit.prevent
      >
        <NFormItem prop="name">
          <NInput
            v-model:value="queryParams.name"
            placeholder="租户名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </NFormItem>

        <NFormItem>
          <NButton type="primary" @click="handleQuery">
            <template #icon>
              <Search />
            </template>
            搜索
          </NButton>

          <NButton type="primary" @click="resetQuery">
            <template #icon>
              <Refresh />
            </template>
            重置
          </NButton>

          <NButton
            type="primary"
            v-access:code="['sys:tenant:add']"
            @click="openTenantDialog()"
          >
            <template #icon>
              <Plus />
            </template>
            新增
          </NButton>

          <NButton
            type="error"
            :disabled="tenantIds.length === 0"
            v-access:code="['sys:tenant:delete']"
            @click="handleDelete()"
          >
            <template #icon>
              <Delete />
            </template>
            删除
          </NButton>
        </NFormItem>
      </NForm>
      <NTable
        ref="dataTableRef"
        :data="tenantTableData"
        :bordered="true"
        :single-line="false"
        :loading="loading"
      >
        <thead>
          <tr>
            <th style="width: 80px; text-align: center;">
              <input
                type="checkbox"
                @change="(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.checked) {
                    // 选中所有行
                    tenantTableData?.forEach(row => {
                      if (!tenantIds.value.includes(row.id)) {
                        tenantIds.value.push(row.id);
                      }
                    });
                  } else {
                    // 取消选中所有行
                    tenantIds.value.splice(0);
                  }
                }"
              />
            </th>
            <th style="width: 80px; text-align: center;">序号</th>
            <th style="width: 200px; text-align: center;">租户名称</th>
            <th style="width: 200px; text-align: center;">租户编码</th>
            <th style="width: 120px; text-align: center;">状态</th>
            <th style="width: 100px; text-align: center;">排序</th>
            <th style="width: 200px; text-align: center;">创建时间</th>
            <th style="width: 200px; text-align: center;">更新时间</th>
            <th style="text-align: center;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in tenantTableData"
            :key="row.id"
            :class="{ 'n-table--row-current': row.id === currentRow?.id }"
            @click="currentRow = row"
          >
            <td style="text-align: center;">
              <input
                type="checkbox"
                :checked="tenantIds.value.includes(row.id)"
                @change="(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.checked) {
                    if (!tenantIds.value.includes(row.id)) {
                      tenantIds.value.push(row.id);
                    }
                  } else {
                    const index = tenantIds.value.indexOf(row.id);
                    if (index > -1) {
                      tenantIds.value.splice(index, 1);
                    }
                  }
                }"
              />
            </td>
            <td style="text-align: center;">{{ (queryParams.page - 1) * queryParams.limit + index + 1 }}</td>
            <td style="text-align: center;">{{ row.name }}</td>
            <td style="text-align: center;">{{ row.code }}</td>
            <td style="text-align: center;">
              <NTag v-if="row.status === 1" type="success">正常</NTag>
              <NTag v-else type="info">禁用</NTag>
            </td>
            <td style="text-align: center;">{{ row.sort }}</td>
            <td style="text-align: center;">{{ row.createTime }}</td>
            <td style="text-align: center;">{{ row.updateTime }}</td>
            <td style="text-align: center;">
              <NButton
                type="primary"
                size="small"
                quaternary
                @click="openTenantUserDialog(row.id, row.name)"
                v-access:code="['sys:tenant:user:add']"
              >
                <template #icon>
                  <User />
                </template>
                分配用户
              </NButton>

              <NButton
                type="primary"
                size="small"
                quaternary
                v-access:code="['sys:tenant:edit']"
                @click="openTenantDialog(row.id)"
              >
                <template #icon>
                  <Edit />
                </template>
                编辑
              </NButton>

              <NButton
                type="primary"
                size="small"
                quaternary
                v-access:code="['sys:tenant:delete']"
                @click="handleDelete(row.id)"
              >
                <template #icon>
                  <Delete />
                </template>
                删除
              </NButton>
            </td>
          </tr>
        </tbody>
      </NTable>
      <NPagination
        v-if="total > 0"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :item-count="total"
        :page-sizes="[10, 20, 30, 40, 50, 100]"
        @update:page="handleQuery"
        @update:page-size="handleQuery"
      />

    <TenantFormDialog ref="tenantFormDialogRef" @success="handleQuery" />

    <TenantUserDialog ref="tenantUserDialogRef" @success="resetQuery" />
  </div>
</template>
