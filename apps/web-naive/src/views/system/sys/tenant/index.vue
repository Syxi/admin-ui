<script setup lang="ts">
import type { TenantPage, TenantQuery } from '#/api/system/sys/tenant';

import { onMounted, reactive, ref, computed, h } from 'vue';

import { Icon } from '@iconify/vue';
import { 
  NForm,
  NFormItem,
  NInput,
  NButton,
  NTable,
  NTag,
  NPagination,
  useMessage,
  useDialog
} from 'naive-ui';

import {
  deleteTenantApi,
  selectTenantPageApi,
} from '#/api/system/sys/tenant';
import { useCardHeight } from '#/hooks/useCardHeight';
import TenantFormDialog from '#/views/system/sys/tenant/TenantFormDialog.vue';
import TenantUserDialog from '#/views/system/sys/tenant/TenantUserDialog.vue';
import TenantPackageAssignDialog from '#/views/system/sys/tenantPackage/TenantPackageAssignDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";

defineOptions({
  name: 'Tenant',
  inheritAttrs: false,
});

const queryFormRef = ref();
const message = useMessage();
const dialog = useDialog();

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

// 租户套餐授权组件
const tenantPackageAssignDialogRef = ref();

/**
 * 打开租户分配用户弹窗
 * @param id
 * @param tenantName
 */
function openTenantUserDialog(id: string, tenantName: string) {
  tenantUserDialogRef.value.openUserDialog(id, tenantName);
}

/**
 * 打开租户套餐授权弹窗
 * @param id
 * @param tenantName
 */
function openTenantPackageAssignDialog(id: string, tenantName: string) {
  tenantPackageAssignDialogRef.value.open(id, tenantName);
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

  dialog.warning({
    title: '警告',
    content: '确定删除已选中的数据?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
    loading.value = true;
    deleteTenantApi(ids)
      .then(() => {
        message.success('删除成功');
        resetQuery();
      } catch (error) {
        console.error('删除失败:', error);
      } finally {
        loading.value = false;
      }
    }
  });
}

const { tableHeight } = useTableHeight(queryFormRef);

onMounted(() => {
  handleQuery();
});

// 表格列定义
const tableColumns = [
  {
    type: 'selection',
    align: 'center',
    width: 80,
  },
  {
    title: '序号',
    key: 'index',
    width: 80,
    align: 'center',
    render: (row, index) => index + 1,
  },
  {
    title: '租户名称',
    key: 'name',
    width: 200,
    align: 'center',
  },
  {
    title: '租户编码',
    key: 'code',
    width: 200,
    align: 'center',
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
    align: 'center',
    render: (row) => {
      return h(NTag, {
        type: row.status === 1 ? 'success' : 'info'
      }, {
        default: () => row.status === 1 ? '正常' : '禁用'
      });
    }
  },
  {
    title: '排序',
    key: 'sort',
    width: 100,
    align: 'center',
    sorter: 'default'
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 200,
    align: 'center',
    sorter: 'default'
  },
  {
    title: '更新时间',
    key: 'updateTime',
    width: 200,
    align: 'center',
    sorter: 'default'
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    width: 350,
    render: (row) => {
      return h('div', { style: { display: 'flex', justifyContent: 'center', gap: '8px' } }, [
        h(NButton, {
          type: 'primary',
          size: 'small',
          quaternary: true,
          onClick: () => openTenantUserDialog(row.id, row.name),
          vAccessCode: ['sys:tenant:user:add']
        }, { default: () => [
          h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:account' }) })
          '分配用户'
        ]}),
        h(NButton, {
          type: 'success',
          size: 'small',
          quaternary: true,
          onClick: () => openTenantPackageAssignDialog(row.id, row.name),
          vAccessCode: ['sys:tenantPackage:assign']
        }, { default: () => [
          h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:key' }) })
          '套餐授权'
        ]}),
        h(NButton, {
          type: 'primary',
          size: 'small',
          quaternary: true,
          vAccessCode: ['sys:tenant:edit'],
          onClick: () => openTenantDialog(row.id)
        }, { default: () => [
          h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:pencil' }) })
          '编辑'
        ]}),
        h(NButton, {
          type: 'primary',
          size: 'small',
          quaternary: true,
          vAccessCode: ['sys:tenant:delete'],
          onClick: () => handleDelete(row.id)
        }, { default: () => [
          h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:delete' }) })
          '删除'
        ]})
      ]);
    }
  }
];

// 分页配置
const pagination = computed(() => ({
  page: queryParams.page,
  pageSize: queryParams.limit,
  itemCount: total.value,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 40, 50],
  onUpdatePage: (page: number) => {
    queryParams.page = page;
    handleQuery();
  },
  onUpdatePageSize: (pageSize: number) => {
    queryParams.limit = pageSize;
    handleQuery();
  }
}));
</script>

<template>
  <div class="app-container">
      <n-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        @submit.prevent="handleQuery"
      >
        <n-form-item prop="name">
          <n-input
            v-model:value="queryParams.name"
            placeholder="租户名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </n-form-item>

        <n-form-item>
          <n-button attr-type="button" type="primary" @click="handleQuery">
            <template #icon>
              <n-icon><Icon icon="mdi:magnify" /></n-icon>
            </template>
            搜索
          </n-button>

          <n-button attr-type="button" type="primary" @click="resetQuery">
            <template #icon>
              <n-icon><Icon icon="mdi:refresh" /></n-icon>
            </template>
            重置
          </n-button>

          <n-button
            type="primary"
            v-access:code="['sys:tenant:add']"
            @click="openTenantDialog()"
          >
            <template #icon>
              <n-icon><Icon icon="mdi:plus" /></n-icon>
            </template>
            新增
          </n-button>

          <n-button
            type="error"
            :disabled="tenantIds.length === 0"
            v-access:code="['sys:tenant:delete']"
            @click="handleDelete()"
          >
            <template #icon>
              <n-icon><Icon icon="mdi:delete" /></n-icon>
            </template>
            删除
          </n-button>
        </n-form-item>
      </n-form>
      <n-data-table
        ref="dataTableRef"
        :loading="loading"
        :data="tenantTableData"
        :columns="tableColumns"
        :pagination="pagination"
        :row-key="(row) => row.id"
        @update-checked-row-keys="handleSelectionChange"
        :scroll-x="1200"
        flex-height
        :style="{ height: `${tableHeight}px` }"
      />
















      <div v-if="total > 0" class="pagination-container" style="margin-top: 16px;">
        <n-space justify="center">
          <n-pagination
            v-model:page="queryParams.page"
            v-model:page-size="queryParams.limit"
            :item-count="total"
            :page-sizes="[
              { label: '10/页', value: 10 },
              { label: '20/页', value: 20 },
              { label: '30/页', value: 30 },
              { label: '50/页', value: 50 },
              { label: '100/页', value: 100 }
            ]"
            @update-page="handleQuery"
            @update-page-size="handleQuery"
            show-size-picker
            show-quick-jumper
          />
        </n-space>
      </div>

    <TenantFormDialog ref="tenantFormDialogRef" @success="handleQuery" />

    <TenantUserDialog ref="tenantUserDialogRef" @success="resetQuery" />
  </div>
</template>
