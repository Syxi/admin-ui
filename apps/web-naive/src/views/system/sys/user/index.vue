<script setup lang="ts">
import type { UserPage, UserQuery } from '#/api/system/sys/user';

import { h, onMounted, reactive, ref, watch } from 'vue';

import { NButton, NDataTable, NInput, NSelect, NDatePicker, NDropdown, NDropdownOption, NPagination, NCheckbox, NTag, NForm, NFormItem, NSpace, NCard, NLayoutSider, NLayoutContent, NLayout, NTree } from 'naive-ui';
import { message, dialog } from '#/adapter/naive';

import { deptOptionTreeApi } from '#/api/system/sys/dept';
import {
  deleteUserApi,
  disableUserApi,
  enableUserApi,
  exportUserApi,
  resetPwdApi,
  selectUserPageApi,
} from '#/api/system/sys/user';
import { useAutoHeight } from '#/hooks/useAutoHeight';
import { useTableHeight } from '#/hooks/useTableHeight';
import UploadUserDialog from '#/views/system/sys/user/UploadUserDialog.vue';
import UserFormDialog from '#/views/system/sys/user/UserFormDialog.vue';

import { ArrowDown, Search, Refresh, Plus, Upload, Download, Edit, Delete, ArrowLeft, ArrowRight } from '@vben/icons';
import { useUserStore } from '@vben/stores';

defineOptions({
  name: 'User',
  inheritAttrs: false,
});
// 加载状态
const loading = ref(false);

// 用户ids
const userIds = ref<string[]>([]);

// 查询参数
const queryParams = reactive<UserQuery>({
  page: 1,
  limit: 20,
});

const dateTimeRange = ref('');

watch(dateTimeRange, (newVal) => {
  if (newVal) {
    queryParams.startTime = newVal[0];
    queryParams.endTime = newVal[1];
  } else {
    queryParams.startTime = undefined;
    queryParams.endTime = undefined;
  }
});

// 分页总记录数
const total = ref(0);

// 分页列表数据
const userTableData = ref<UserPage[]>();

// 组织下拉选项树数据
const deptTreeOptionData = ref<any[]>([]);

// 组织树
const deptTreeRef = ref(NTree);

// 组织名称
const deptName = ref('');

watch(deptName, (val) => {
  deptTreeRef.value!.filter(val);
});

// 搜索树节点
const filterNode = (value: string, data: any) => {
  if (!value) return true;
  return data.label.includes(value);
};

// 查询表单
const queryFormRef = ref(NForm);

// 用户表单子组件
const userFormDialogRef = ref();
function openFormDialog(userId?: string) {
  userFormDialogRef.value.openDialog(userId, deptTreeOptionData.value);
}

// 上传用户子组件
const uploadUserDialogRef = ref();
function openUploadUserDialog() {
  uploadUserDialogRef.value.openUploadDialog();
}

// 查询用户事件
async function handleQuery() {
  loading.value = true;
  try {
    const data = await selectUserPageApi(queryParams);
    userTableData.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

// 重置查询事件
function resetQuery() {
  queryFormRef.value.resetFields();
  dateTimeRange.value = '';
  queryParams.page = 1;
  queryParams.deptId = '';
  handleQuery();
}

// 行checkbox 单选或多选事件
function handleSelectionChange(selection: any) {
  userIds.value = selection.map((item: any) => item.userId);
}

// 重置密码
async function resetPassword() {
  const ids = userIds.value;
  if (ids.length > 0) {
    const data = await resetPwdApi(ids);
    message.success(`密码重置成功，新密码是：${data}`);
    resetQuery();
  }
}

/**
 * 启用用户
 */
async function enableUser() {
  const ids = userIds.value;
  if (ids.length > 0) {
    dialog.warning({
      title: '启用用户',
      content: '确定启用用户?',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        await enableUserApi(ids);
        message.success('启用用户成功!');
        resetQuery();
      },
      onNegativeClick: () => {
        message.error('启用用户失败!');
      }
    });
  }
}

/**
 * 禁用用户
 */
async function disableUser() {
  const ids = userIds.value;
  if (ids.length > 0) {
    dialog.warning({
      title: '禁用用户',
      content: '确定禁用用户?',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        await disableUserApi(ids);
        message.success('禁用用户成功!');
        resetQuery();
      },
      onNegativeClick: () => {
        message.error('禁用用户失败');
      }
    });
  }
}

/**
 * 点击树节点，查询部门用户
 * @param node
 */
function handleNodeClick(node: any) {
  queryParams.deptId = node.value;
  handleQuery();
}

// 获取部门下拉选项
async function deptTreeOptions() {
  deptTreeOptionData.value = await deptOptionTreeApi();
}

// 删除用户事件
async function handleDelete(userId?: string) {
  let ids: string[];
  if (userId) {
    ids = [String(userId)]; // 删除单条记录
  } else if (userIds.value.length > 0) {
    ids = userIds.value; // 删除多条记录
  } else {
    message.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

    dialog.warning({
      title: '警告',
      content: '确定删除用户?',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        await deleteUserApi(ids);
        message.success('删除成功!');
        resetQuery();
      }
    });
}

/**
 * 导出用户
 */
async function handleExport() {
  const ids = userIds.value;
  if (ids.length === 0) {
    message.error('请选择导出的用户');
    return;
  }

  const response = await exportUserApi(ids);
  const fileData = response.data;
  const fileName = decodeURI(
    response.headers['content-disposition'].split(';')[1].split('=')[1],
  );
  const fileType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8';

  const blob = new Blob([fileData], { type: fileType });
  const downloadUrl = window.URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = fileName;

  document.body.append(downloadLink);
  downloadLink.click();

  downloadLink.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

// 控制左侧机构树区域的显示与隐藏
const isDeptTreeVisible = ref(true);

// 切换左侧机构树显示状态
function toggleDeptTree() {
  isDeptTreeVisible.value = !isDeptTreeVisible.value;
}

onMounted(() => {
  // 初始化用户列表数据
  handleQuery();
  deptTreeOptions();
});

const { tableHeight } = useTableHeight(queryFormRef, {
  headerHeight: 100, // 增加头部高度以适应实际布局
  tableOffset: -80   // 调整表格偏移量
});
const autoHeight = useAutoHeight(180); // 调整自动高度偏移量
</script>

<template>
  <div class="user-container">
    <!--部门树-->
    <n-layout :has-sider="true" class="w-full h-full">
      <n-layout-sider v-if="isDeptTreeVisible" :width="240" :collapsed="false" :show-trigger="false" class="border-r">
        <div class="tree-container-wrapper">
        <div class="tree-container-wrapper">
            <n-input
              v-model:value="deptName"
              placeholder="机构名称"
              style="width: 100%"
            >
              <template #prefix>
                <n-icon><search /></n-icon>
            </n-input>

          <n-scrollbar :style="{height: autoHeight + 'px'}" class="tree-container">
            <n-tree
              class="mt-2"
              ref="deptTreeRef"
              :data="deptTreeOptionData"
              :default-expand-all="true"
              :filter="filterNode"
              @update:selected-keys="(keys) => {
                const node = deptTreeOptionData.find(item => item.value === keys[0]);
                if(node) handleNodeClick(node);
              }"
            />
          </n-scrollbar>
          <!-- 收缩按钮 -->
          <div class="toggle-button" @click="toggleDeptTree" v-if="isDeptTreeVisible">
            <n-icon>
              <ArrowLeft />
            </n-icon>
          </div>
        </div>
      </n-layout-sider>

      <!-- 分割线 -->
      <div class="divider" v-show="isDeptTreeVisible"></div>

      <!-- 展开按钮（当机构树隐藏时显示） -->
      <div class="expand-button" @click="toggleDeptTree" v-if="!isDeptTreeVisible">
        <n-icon>
          <ArrowRight />
        </n-icon>
      </div>

      <n-layout-content class="h-full">
        <div class="data-container">
          <n-form :model="queryParams" ref="queryFormRef" :inline="true">
            <n-form-item path="Keywords">
              <n-input
                v-model:value="queryParams.Keywords"
                placeholder="请输入用户名或真实姓名"
                @keyup.enter="handleQuery()"
                @clear="() => queryParams.Keywords = undefined"
              />
            </n-form-item>

<!--            <el-form-item prop="realName">-->
<!--              <el-input-->
<!--                v-model="queryParams.realName"-->
<!--                placeholder="请输入真实姓名"-->
<!--                @keyup.enter="handleQuery()"-->
<!--                clearable-->
<!--              />-->
<!--            </el-form-item>-->

            <n-form-item path="status">
              <n-select
                v-model:value="queryParams.status"
                placeholder="用户状态"
                class="!w-[100px]"
                :options="[
                  { label: '正常', value: '1' },
                  { label: '禁用', value: '-1' }
                ]"
                @update:value="handleQuery()"
              />
            </n-form-item>

            <n-form-item>
              <n-date-picker
                v-model:formatted-value="dateTimeRange"
                type="daterange"
                start-placeholder="开始时间"
                end-placeholder="截止时间"
                unlink-panels
              />
            </n-form-item>

            <n-form-item>
              <n-button type="primary" @click="handleQuery()">
                <template #icon>
                  <n-icon><Search /></n-icon>
                </template>
                搜索
              </n-button>

              <n-button type="primary" @click="resetQuery()">
                <template #icon>
                  <n-icon><Refresh /></n-icon>
                </template>
                重置
              </n-button>

              <n-button
                v-access:code="'sys:user:add'"
                type="primary"
                @click="openFormDialog()"
              >
                <template #icon>
                  <n-icon><Plus /></n-icon>
                </template>
                新增
              </n-button>

              <n-button
                type="primary"
                @click="openUploadUserDialog"
                v-access:code="['sys:user:import']"
              >
                <template #icon>
                  <n-icon><Upload /></n-icon>
                </template>
                导入
              </n-button>

              <n-button
                type="primary"
                @click="handleExport"
                v-access:code="['sys:user:export']"
                class="mr-3"
              >
                <template #icon>
                  <n-icon><Download /></n-icon>
                </template>
                导出
              </n-button>

              <n-dropdown
                trigger="click"
                :options="[
                  { label: '批量删除', key: 'delete', disabled: !userIds.length, permission: ['sys:user:delete'] },
                  { label: '批量启用', key: 'enable', disabled: !userIds.length, permission: ['sys:user:enable'] },
                  { label: '批量禁用', key: 'disable', disabled: !userIds.length, permission: ['sys:user:disable'] },
                  { label: '批量重置密码', key: 'password', disabled: !userIds.length, permission: ['sys:user:password'] },
                ].filter(item => {
                  const userStore = useUserStore();
                  const hasPermission = (codes: string | string[]) => {
                    const permissions = Array.isArray(codes) ? codes : [codes];
                    return userStore.permissions.some(p => permissions.includes(p));
                  };
                  return hasPermission(item.permission);
                })
                "
                @select="(key) => {
                  if(key === 'delete') handleDelete();
                  else if(key === 'enable') enableUser();
                  else if(key === 'disable') disableUser();
                  else if(key === 'password') resetPassword();
                }"
              >
                <n-button type="primary">
                  批量操作 <n-icon class="ml-2"><arrow-down/></n-icon>
                </n-button>
              </n-dropdown>



          </n-form>
          <n-data-table
            v-model:checked-row-keys="userIds"
            :loading="loading"
            :columns="[
              {
                type: 'selection',
                disabled: (row) => false,
              },
              {
                title: '序号',
                key: 'index',
                render: (row, index) => index + 1,
                width: 80,
                align: 'center'
              },
              {
                title: '编号',
                key: 'userId',
                width: 100,
                align: 'center',
                render: (row) => row.userId,
                hide: true
              },
              {
                title: '用户名',
                key: 'username',
                width: 150,
                align: 'center',
                render: (row) => row.username,
              },
              {
                title: '真实姓名',
                key: 'realName',
                align: 'center',
                render: (row) => row.realName,
              },
              {
                title: '性别',
                key: 'genderLabel',
                width: 80,
                align: 'center',
                render: (row) => row.genderLabel,
              },
              {
                title: '角色名称',
                key: 'roleNames',
                align: 'center',
                render: (row) => row.roleNames,
                ellipsis: { tooltip: true },
              },
              {
                title: '部门名称',
                key: 'deptName',
                align: 'center',
                render: (row) => row.deptName,
              },
              {
                title: '手机号码',
                key: 'mobile',
                width: 120,
                align: 'center',
                render: (row) => row.mobile,
              },
              {
                title: '状态',
                key: 'status',
                width: 80,
                align: 'center',
                render: (row) => {
                  return h(NTag, {
                    type: row.status === 1 ? 'success' : 'info',
                  }, {
                    default: () => row.status === 1 ? '正常' : '禁用'
                  });
                }
              },
              {
                title: '创建时间',
                key: 'createTime',
                width: 160,
                align: 'center',
                render: (row) => row.createTime,
              },
              {
                title: '操作',
                key: 'actions',
                width: 150,
                render: (row) => {
                  return h(NSpace, null, {
                    default: () => [
                      h(NButton, {
                        type: 'primary',
                        size: 'small',
                        quaternary: true,
                        onClick: () => openFormDialog(row.userId),
                        disabled: !(() => {
                          const userStore = useUserStore();
                          return userStore.permissions.some(p => p === 'sys:user:edit');
                        })()
                      }, { default: () => '编辑' }),
                      h(NButton, {
                        type: 'error',
                        size: 'small',
                        quaternary: true,
                        onClick: () => handleDelete(row.userId),
                        disabled: !(() => {
                          const userStore = useUserStore();
                          return userStore.permissions.some(p => p === 'sys:user:delete');
                        })()
                      }, { default: () => '删除' })
                    ]
                  });
                }
              }
            ]"
            :data="userTableData"
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
            :scroll-x="1000"
          />
        </div>
      </n-layout-content>
    </n-layout>

    <!-- 表单弹窗 -->
    <UserFormDialog ref="userFormDialogRef" @success="resetQuery" />

    <!-- 上传excel弹窗 -->
    <UploadUserDialog ref="uploadUserDialogRef" @success="resetQuery" />
  </div>
</template>

<style lang="scss" scoped>
.user-container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: hsl(var(--background));
}

.n-layout {
  position: relative;
  flex: 1;
  min-height: 0; /* 允许flex项目收缩到内容高度 */
}

.tree-container-wrapper {
  position: relative;
  height: 100%;
  padding: 30px 20px 0 20px;
  margin-right: 1px; /* 为分割线预留空间 */
}

.tree-container {
  display: flex;
  flex-direction: column;
  background-color: hsl(var(--background));
  border-radius: var(--radius);
  height: 100%;
}

.toggle-button {
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: var(--n-primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-button:hover {
  background: var(--n-primary-color-hover);
}

.expand-button {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: var(--n-primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.expand-button:hover {
  background: var(--n-primary-color-hover);
}

.divider {
  position: absolute;
  top: 0;
  left: calc((100% / 6) - 1px); /* 4/24 = 1/6，更简洁的计算方式 */
  width: 1px;
  height: 100%;
  background-color: hsl(var(--border));
  z-index: 1;
}

.data-container {
  width: 100%;
  height: 100%;
  padding: 30px 20px 0 20px;
}
</style>
