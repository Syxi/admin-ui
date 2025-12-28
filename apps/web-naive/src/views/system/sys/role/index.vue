<script setup lang="ts">
import type { RolePage, RoleQuery } from '#/api/system/sys/role';

import { onMounted, reactive, ref } from 'vue';

import { useMessage, NForm, NFormItem, NInput, NButton, NDataTable, NTag, NPagination, useDialog } from 'naive-ui';

import { h } from 'vue';

// 消息提示
const message = useMessage();

// 对话框
const dialog = useDialog();

import {
  deleteRoleApi,
  disableRoleApi,
  enableRoleApi,
  selectRolePageApi,
} from '#/api/system/sys/role';
import { useTableHeight } from '#/hooks/useTableHeight';
import RoleFormDialog from '#/views/system/sys/role/RoleFormDialog.vue';
import RoleMenuDrawer from '#/views/system/sys/role/RoleMenuDrawer.vue';
import RoleUserDialog from '#/views/system/sys/role/RoleUserDialog.vue';
// 引入数据权限弹窗组件
import RoleDataPermissionDialog from '#/views/system/sys/role/RoleDataPermissionDialog.vue';

defineOptions({
  name: 'Role',
  inheritAttrs: false,
});

const queryFormRef = ref();

const loading = ref(false);

const roleIds = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<RoleQuery>({
  page: 1,
  limit: 20,
});

const roleTableData = ref<RolePage[]>();

// 角色表单组件
const roleFormDialogRef = ref();
/**
 * 打开角色表单弹窗
 */
function openRoleDialog(id?: string) {
  roleFormDialogRef.value.open(id);
}

// 角色菜单组件
const roleMenuDialogRef = ref();

/**
 * 打开角色菜单弹窗
 * @param id
 * @param roleName
 */
function openRoleMenuDrawer(id: string, roleName: string) {
  roleMenuDialogRef.value.openMenuDialog(id, roleName);
}

// 角色用户组件
const roleUserDialogRef = ref();

/**
 * 打开角色分配用户弹窗
 * @param id
 * @param roleName
 */
function openRoleUserDialog(id: string, roleName: string) {
  roleUserDialogRef.value.openUserDialog(id, roleName);
}

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  // 多选的roleIds
  roleIds.value = selection.map((item: any) => item.roleId);
}

/**
 * 排序事件
 * @param prop 排序字段
 * @param order {null: 不排序；ascending: 升序；descending: 降序}
 */
const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  if (order === null) {
    queryParams.orderByColumn = '';
    queryParams.ascOrDesc = '';
  } else {
    queryParams.orderByColumn = prop;
    queryParams.ascOrDesc = order === 'ascending' ? 'asc' : 'desc';
  }
  handleQuery();
};

/**
 * 查询角色
 */
function handleQuery() {
  loading.value = true;
  selectRolePageApi(queryParams)
    .then((data) => {
      roleTableData.value = data.list;
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
 * 删除角色
 * @param roleId
 */
function handleDelete(roleId?: string) {
  let ids: string[];
  if (roleId) {
    ids = [String(roleId)]; // 删除单条记录
  } else if (roleIds.value.length > 0) {
    ids = roleIds.value; // 删除多条记录
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
      deleteRoleApi(ids)
        .then(() => {
          message.success('删除成功');
          resetQuery();
        })
        .finally(() => {
          loading.value = false;
        });
    }
  });
}

/**
 * 启动角色
 */
function enableRole() {
  const ids = roleIds.value;
  if (ids.length > 0) {
    dialog.warning({
      title: '启动角色',
      content: '确定启动角色?',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        enableRoleApi(ids).then(() => {
          message.success('启动角色成功');
          resetQuery();
        });
      },
      onNegativeClick: () => {
        message.error('启动角色失败');
        resetQuery();
      }
    });
  }
}

/**
 * 禁用角色
 */
function disableRole() {
  const ids = roleIds.value;
  if (ids.length > 0) {
    dialog.warning({
      title: '禁用角色',
      content: '确定禁用角色?',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        disableRoleApi(ids).then(() => {
          message.success('禁用角色成功');
          resetQuery();
        });
      },
      onNegativeClick: () => {
        message.error('禁用角色失败');
        resetQuery();
      }
    });
  }
}

// 数据权限组件
const roleDataPermissionDialogRef = ref();

/**
 * 打开数据权限弹窗
 * @param id 角色ID
 * @param roleName 角色名称
 * @param roleCode 角色编码
 */
function openRoleDataPermissionDialog(id: string, roleName: string, roleCode: string) {
  roleDataPermissionDialogRef.value.open(id, roleName, roleCode);
}

const { tableHeight } = useTableHeight(queryFormRef);

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
      <NFormItem prop="roleName">
        <NInput
          v-model:value="queryParams.roleName"
          placeholder="角色名称"
          clearable
          style="width: 240px"
          @keyup.enter="handleQuery"
        />
      </NFormItem>

      <NFormItem>
        <NButton type="primary" @click="handleQuery">
          搜索
        </NButton>

        <NButton type="primary" @click="resetQuery">
          重置
        </NButton>

        <NButton
          type="primary"
          v-access:code="['sys:role:add']"
          @click="openRoleDialog()"
        >
          新增
        </NButton>

        <NButton
          type="primary"
          v-access:code="['sys:role:enable']"
          @click="enableRole()"
        >
          启用
        </NButton>

        <NButton
          type="error"
          :disabled="roleIds.length === 0"
          v-access:code="['sys:role:disable']"
          @click="disableRole()"
        >
          禁用
        </NButton>

        <NButton
          type="error"
          :disabled="roleIds.length === 0"
          v-access:code="['sys:role:delete']"
          @click="handleDelete()"
        >
          删除
        </NButton>
      </NFormItem>
    </NForm>
    <NDataTable
      ref="dataTableRef"
      :loading="loading"
      :data="roleTableData"
      :columns="[
        {
          type: 'selection',
          width: 80,
          align: 'center'
        },
        {
          title: '序号',
          key: 'index',
          width: 80,
          align: 'center',
          render: (row, index) => index + 1
        },
        {
          title: '角色名称',
          key: 'roleName',
          align: 'center',
          width: 200
        },
        {
          title: '角色编码',
          key: 'roleCode',
          align: 'center',
          width: 200
        },
        {
          title: '状态',
          key: 'status',
          align: 'center',
          width: 120,
          render: (row) => {
            return row.status === 1 
              ? h(NTag, { type: 'success' }, { default: () => '正常' })
              : h(NTag, { type: 'info' }, { default: () => '禁用' })
          }
        },
        {
          title: '排序',
          key: 'sort',
          align: 'center',
          width: 100,
          sorter: 'default'
        },
        {
          title: '创建时间',
          key: 'createTime',
          align: 'center',
          width: 200,
          sorter: 'default'
        },
        {
          title: '更新时间',
          key: 'updateTime',
          align: 'center',
          width: 200,
          sorter: 'default'
        },
        {
          title: '操作',
          key: 'actions',
          align: 'center',
          width: 400,
          render: (row) => [
            h(NButton,
              {
                type: 'primary',
                size: 'small',
                text: true,
                onClick: () => openRoleMenuDrawer(row.roleId, row.roleName)
              },
              { default: () => '菜单授权' }
            ),
            h('span', { style: 'margin: 0 8px;' }, '|'),
            h(NButton,
              {
                type: 'primary',
                size: 'small',
                text: true,
                onClick: () => openRoleUserDialog(row.roleId, row.roleName)
              },
              { default: () => '分配用户' }
            ),
            h('span', { style: 'margin: 0 8px;' }, '|'),
            h(NButton,
              {
                type: 'primary',
                size: 'small',
                text: true,
                onClick: () => openRoleDataPermissionDialog(row.roleId, row.roleName, row.roleCode)
              },
              { default: () => '数据权限' }
            ),
            h('span', { style: 'margin: 0 8px;' }, '|'),
            h(NButton,
              {
                type: 'primary',
                size: 'small',
                text: true,
                onClick: () => openRoleDialog(row.roleId)
              },
              { default: () => '编辑' }
            ),
            h('span', { style: 'margin: 0 8px;' }, '|'),
            h(NButton,
              {
                type: 'primary',
                size: 'small',
                text: true,
                onClick: () => handleDelete(row.roleId)
              },
              { default: () => '删除' }
            )
          ]
        }
      ]"
      :row-key="(row) => row.roleId"
      @update:checked-row-keys="handleSelectionChange"
      :scroll-x="1200"
      :virtual-scroll="false"
      :pagination="false"
      :height="tableHeight"
    />
    <NPagination
      v-if="total > 0"
      v-model:page="queryParams.page"
      v-model:page-size="queryParams.limit"
      :page-count="Math.ceil(total / queryParams.limit)"
      :page-sizes="[10, 20, 30, 40, 50, 100]"
      :show-size-picker="true"
      @update:page="handleQuery"
      @update:page-size="handleQuery"
      @update:page-count="handleQuery"
    />

    <RoleFormDialog ref="roleFormDialogRef" @success="handleQuery" />

    <RoleMenuDrawer ref="roleMenuDialogRef" @success="resetQuery" />

    <RoleUserDialog ref="roleUserDialogRef" @success="resetQuery" />

    <RoleDataPermissionDialog ref="roleDataPermissionDialogRef" @success="resetQuery" />
  </div>
</template>
