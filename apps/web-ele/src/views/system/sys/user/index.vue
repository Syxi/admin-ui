<script setup lang="ts">
import type { UserPage, UserQuery } from '#/api/system/sys/user';

import { onMounted, reactive, ref, watch } from 'vue';

import { ElForm, ElMessage, ElMessageBox, ElTree } from 'element-plus';

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
import UploadUserDialog from '#/views/system/sys/user/UploadUserDialog.vue';
import UserFormDialog from '#/views/system/sys/user/UserFormDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";
import { ArrowDown } from "@element-plus/icons-vue";

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
const deptTreeOptionData = ref<OptionType[]>([]);

// 组织树
const deptTreeRef = ref(ElTree);

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
const queryFormRef = ref(ElForm);

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
    ElMessage.success(`密码重置成功，新密码是：${data}`);
    resetQuery();
  }
}

/**
 * 启用用户
 */
async function enableUser() {
  const ids = userIds.value;
  if (ids.length > 0) {
    ElMessageBox.confirm('确定启用用户?', '启用用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(async () => {
        await enableUserApi(ids);
        ElMessage.success('启用用户成功!');
        resetQuery();
      })
      .catch(() => {
        ElMessage.error('启用用户失败!');
      });
  }
}

/**
 * 禁用用户
 */
async function disableUser() {
  const ids = userIds.value;
  if (ids.length > 0) {
    ElMessageBox.confirm('确定禁用用户?', '禁用用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(async () => {
        await disableUserApi(ids);
        ElMessage.success('禁用用户成功!');
        resetQuery();
      })
      .catch(() => {
        ElMessage.error('禁用用户失败');
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
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除用户?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteUserApi(ids);
    ElMessage.success('删除成功!');
    resetQuery();
  });
}

/**
 * 导出用户
 */
async function handleExport() {
  const ids = userIds.value;
  if (ids.length === 0) {
    ElMessage.error('请选择导出的用户');
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
    <el-row :gutter="4">
      <el-col :span="isDeptTreeVisible ? 4 : 0">
        <div class="tree-container-wrapper">
            <el-input
              v-model="deptName"
              placeholder="机构名称"
              style="width: 100%"
            >
              <template #prefix>
                <el-icon><search /></el-icon>
              </template>
            </el-input>

          <el-scrollbar :height="autoHeight" class="tree-container">
            <ElTree
              class="mt-2"
              ref="deptTreeRef"
              :data="deptTreeOptionData"
              highlight-current
              :default-expand-all="true"
              :filter-node-method="filterNode"
              @node-click="handleNodeClick"
            />
          </el-scrollbar>
          <!-- 收缩按钮 -->
          <div class="toggle-button" @click="toggleDeptTree" v-if="isDeptTreeVisible">
            <el-icon>
              <ArrowLeft />
            </el-icon>
          </div>
        </div>
      </el-col>

      <!-- 分割线 -->
      <div class="divider" v-show="isDeptTreeVisible"></div>

      <!-- 展开按钮（当机构树隐藏时显示） -->
      <div class="expand-button" @click="toggleDeptTree" v-if="!isDeptTreeVisible">
        <el-icon>
          <ArrowRight />
        </el-icon>
      </div>

      <el-col :span="isDeptTreeVisible ? 20 : 24">
        <div class="data-container">
          <ElForm :model="queryParams" ref="queryFormRef" :inline="true">
            <el-form-item prop="Keywords">
              <el-input
                v-model="queryParams.Keywords"
                placeholder="请输入用户名或真实姓名"
                @keyup.enter="handleQuery()"
                clearable
              />
            </el-form-item>

<!--            <el-form-item prop="realName">-->
<!--              <el-input-->
<!--                v-model="queryParams.realName"-->
<!--                placeholder="请输入真实姓名"-->
<!--                @keyup.enter="handleQuery()"-->
<!--                clearable-->
<!--              />-->
<!--            </el-form-item>-->

            <el-form-item prop="status">
              <el-select
                v-model="queryParams.status"
                placeholder="用户状态"
                clearable
                class="!w-[100px]"
                @change="handleQuery()"
              >
                <el-option label="正常" value="1" />
                <el-option label="禁用" value="-1" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-date-picker
                v-model="dateTimeRange"
                type="daterange"
                start-placeholder="开始时间"
                end-placeholder="截止时间"
                unlink-panels
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
                v-access:code="'sys:user:add'"
                type="primary"
                @click="openFormDialog()"
              >
                <template #icon>
                  <el-icon><Plus /></el-icon>
                </template>
                新增
              </el-button>

              <el-button
                type="primary"
                @click="openUploadUserDialog"
                v-access:code="['sys:user:import']"
              >
                <template #icon>
                  <el-icon><Upload /></el-icon>
                </template>
                导入
              </el-button>

              <el-button
                type="primary"
                @click="handleExport"
                v-access:code="['sys:user:export']"
                class="mr-3"
              >
                <template #icon>
                  <el-icon><Download /></el-icon>
                </template>
                导出
              </el-button>

              <el-dropdown>
                <el-button type="primary">
                  批量操作 <el-icon class="el-icon--right"><arrow-down/></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-access:code="['sys:user:delete']" @click="handleDelete()">
                      批量删除
                    </el-dropdown-item>
                    <el-dropdown-item v-access:code="['sys:user:enable']" @click="enableUser()">
                      批量启用
                    </el-dropdown-item>
                    <el-dropdown-item v-access:code="['sys:user:disable']" @click="disableUser()">
                      批量禁用
                    </el-dropdown-item>
                    <el-dropdown-item v-access:code="['sys:user:password']" @click="resetPassword()">
                      批量重置密码
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-form-item>



          </ElForm>
          <el-table
            v-loading="loading"
            border
            :data="userTableData"
            @selection-change="handleSelectionChange"
            :height="tableHeight"
          >
            <el-table-column type="selection" width="50" align="center" />

            <el-table-column
              type="index"
              label="序号"
              width="80"
              align="center"
            />

            <el-table-column
              v-if="false"
              key="userId"
              label="编号"
              prop="userId"
              width="100"
            />

            <el-table-column
              key="username"
              label="用户名"
              prop="username"
              align="center"
              width="150"
            />

            <el-table-column label="真实姓名" prop="realName" align="center" />

            <el-table-column
              label="性别"
              prop="genderLabel"
              align="center"
              width="80"
            />

            <el-table-column
              label="角色名称"
              prop="roleNames"
              align="center"
              :show-overflow-tooltip="true"
            />

            <el-table-column prop="deptName" label="部门名称" align="center" />

            <el-table-column
              prop="mobile"
              label="手机号码"
              align="center"
              width="120"
            />

            <!-- <el-table-column prop="email" label="邮箱" align="center" /> -->

            <el-table-column
              label="状态"
              prop="status"
              align="center"
              width="80"
            >
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                  {{ scope.row.status === 1 ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column
              label="创建时间"
              prop="createTime"
              align="center"
              width="160"
            />

            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button
                  type="primary"
                  size="small"
                  link
                  @click="openFormDialog(scope.row.userId)"
                  v-access:code="['sys:user:edit']"
                >
                  <el-icon><Edit /></el-icon>编辑
                </el-button>

                <el-button
                  type="danger"
                  size="small"
                  link
                  @click="handleDelete(scope.row.userId)"
                  v-access:code="['sys:user:delete']"
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
        </div>
      </el-col>
    </el-row>

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

.el-row {
  position: relative;
  flex: 1;
  min-height: 0; /* 允许flex项目收缩到内容高度 */
}

.tree-container-wrapper {
  position: relative;
  height: 100%;
  padding: 20px;
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
  background: var(--el-color-primary);
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
  background: var(--el-color-primary-light-3);
}

.expand-button {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: var(--el-color-primary);
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
  background: var(--el-color-primary-light-3);
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
  padding: 20px 20px 0 20px;
}
</style>
