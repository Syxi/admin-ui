<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <n-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="68px"
    >
      <n-form-item label="套餐名称" path="name">
        <n-input
          v-model:value="queryParams.name"
          placeholder="请输入套餐名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </n-form-item>

      <n-form-item label="套餐编码" path="code">
        <n-input
          v-model:value="queryParams.code"
          placeholder="请输入套餐编码"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </n-form-item>

      <n-form-item label="状态" path="status">
        <n-select
          v-model:value="queryParams.status"
          placeholder="请选择状态"
          clearable
          style="width: 240px"
        >
          <n-option :value="1" label="启用" />
          <n-option :value="-1" label="禁用" />
        </n-select>
      </n-form-item>

      <n-form-item>
        <n-button attr-type="button" type="primary" @click="handleQuery">
          <template #icon>
            <n-icon><Icon icon="mdi:magnify" /></n-icon>
          </template>
          搜索
        </n-button>

        <n-button attr-type="button" @click="resetQuery">
          <template #icon>
            <n-icon><Icon icon="mdi:refresh" /></n-icon>
          </template>
          重置
        </n-button>
      </n-form-item>

      <n-form-item>
        <n-button
          type="primary"
          v-access:code="['sys:tenantPackage:add']"
          @click="openTenantPackageDialog()"
        >
          <template #icon>
            <n-icon><Icon icon="mdi:plus" /></n-icon>
          </template>
          新增
        </n-button>
          <n-button
            type="error"
            :disabled="tenantPackageIds.length === 0"
            v-access:code="['sys:tenantPackage:delete']"
            @click="handleDelete()"
          >
            <template #icon>
              <n-icon><Icon icon="mdi:delete" /></n-icon>
            </template>
            删除
          </n-button>
      </n-form-item>
    </n-form>


    <!-- 数据表格 -->
    <n-data-table
      ref="dataTableRef"
      :data="tenantPackageTableData"
      :columns="tableColumns"
      :loading="loading"
      :pagination="pagination"
      :row-key="(row) => row.id"
      @update-checked-row-keys="handleSelectionChange"
      :scroll-x="1200"
      flex-height
      :style="{ height: `${tableHeight}px` }"
    />
      <!-- 表格列定义将在script部分定义 -->




















    </n-data-table>

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

import { onMounted, reactive, ref, computed, h } from 'vue';
import { Icon } from '@iconify/vue';
import { 
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NOption,
  NButton,
  NButtonGroup,
  NTable,
  NTag,
  NIcon,
  NPagination,
  useMessage,
  useDialog
} from 'naive-ui';
import {
  deleteTenantPackageApi,
  selectTenantPackagePageApi,
} from '#/api/system/sys/tenantPackage';
import { useCardHeight } from '#/hooks/useCardHeight';
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
const message = useMessage();
const dialog = useDialog();
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
  message.info('请在租户管理页面进行套餐授权');
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
    message.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  dialog.warning({
    title: '警告',
    content: '是否确认删除选中的租户套餐数据项？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteTenantPackageApi(ids.join(','));
        message.success('删除成功');
        handleQuery();
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  });
}

onMounted(() => {
  handleQuery();
});

// 表格列定义
const tableColumns = [
  {
    type: 'selection',
    align: 'center',
  },
  {
    title: '序号',
    key: 'index',
    width: 50,
    align: 'center',
    render: (row, index) => index + 1,
  },
  {
    title: '套餐名称',
    key: 'name',
    width: 150,
    align: 'center',
  },
  {
    title: '套餐编码',
    key: 'code',
    width: 150,
    align: 'center',
  },
  {
    title: '套餐描述',
    key: 'description',
    align: 'center',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '最大用户数',
    key: 'maxUsers',
    width: 100,
    align: 'center',
    render: (row) => row.maxUsers ? row.maxUsers : '-'
  },
  {
    title: '最大存储空间(MB)',
    key: 'maxStorage',
    width: 150,
    align: 'center',
    render: (row) => row.maxStorage ? row.maxStorage : '-'
  },
  {
    title: '有效期(天)',
    key: 'validityDays',
    width: 100,
    align: 'center',
    render: (row) => row.validityDays ? row.validityDays : '-'
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    align: 'center',
    render: (row) => {
      return h(NTag, {
        type: row.status === 1 ? 'success' : 'error'
      }, {
        default: () => row.status === 1 ? '启用' : '禁用'
      });
    }
  },
  {
    title: '排序',
    key: 'sort',
    width: 80,
    align: 'center',
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 180,
    align: 'center',
    render: (row) => row.createTime ? formatDateTime(row.createTime) : '-'
  },
  {
    title: '操作',
    key: 'actions',
    width: 280,
    align: 'center',
    fixed: 'right',
    render: (row) => {
      return h('div', { style: { display: 'flex', justifyContent: 'center', gap: '8px' } }, [
        h(NButton, {
          type: 'primary',
          size: 'small',
          quaternary: true,
          vAccessCode: ['sys:tenantPackage:edit'],
          onClick: () => openTenantPackageDialog(row.id)
        }, { default: () => [
          h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:pencil' }) })
          '编辑'
        ]}),
        h(NButton, {
          type: 'primary',
          size: 'small',
          quaternary: true,
          vAccessCode: ['sys:tenantPackage:delete'],
          onClick: () => handleDelete(row.id)
        }, { default: () => [
          h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:delete' }) })
          '删除'
        ]}),
        h(NButton, {
          type: 'success',
          size: 'small',
          quaternary: true,
          vAccessCode: ['sys:tenantPackage:assign'],
          onClick: () => openTenantPackageAssignDialog(row.id, row.name)
        }, { default: () => [
          h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:key' }) })
          '租户授权'
        ]}),
        h(NButton, {
          type: 'warning',
          size: 'small',
          quaternary: true,
          vAccessCode: ['sys:tenantPackage:menu'],
          onClick: () => openTenantPackageMenuDialog(row.id, row.name)
        }, { default: () => [
          h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:menu' }) })
          '菜单授权'
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


