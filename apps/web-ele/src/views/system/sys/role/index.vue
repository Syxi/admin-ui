<script setup lang="ts">
import type { RolePage, RoleQuery } from '#/api/system/sys/role';

import { onMounted, reactive, ref } from 'vue';

import {
  Delete,
  Edit,
  Plus,
  Refresh,
  Setting,
  SwitchButton,
} from '@element-plus/icons-vue';
import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

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

const queryFormRef = ref(ElForm);

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
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    loading.value = true;
    deleteRoleApi(ids)
      .then(() => {
        ElMessage.success('删除成功');
        resetQuery();
      })
      .finally(() => {
        loading.value = false;
      });
  });
}

/**
 * 启动角色
 */
function enableRole() {
  const ids = roleIds.value;
  if (ids.length > 0) {
    ElMessageBox.confirm('确定启动角色?', '启动角色', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success',
    })
      .then(() => {
        enableRoleApi(ids).then(() => {
          ElMessage.success('启动角色成功');
          resetQuery();
        });
      })
      .catch(() => {
        ElMessage.error('启动角色失败');
        resetQuery();
      });
  }
}

/**
 * 禁用角色
 */
function disableRole() {
  const ids = roleIds.value;
  if (ids.length > 0) {
    ElMessageBox.confirm('确定禁用角色?', '禁用角色', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        disableRoleApi(ids).then(() => {
          ElMessage.success('禁用角色成功');
          resetQuery();
        });
      })
      .catch(() => {
        ElMessage.error('禁用角色失败');
        resetQuery();
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

    <ElForm
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      @submit.prevent
    >
      <el-form-item prop="roleName">
        <el-input
          v-model="queryParams.roleName"
          placeholder="角色名称"
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
          v-access:code="['sys:role:add']"
          @click="openRoleDialog()"
        >
          <template #icon>
            <el-icon><Plus /></el-icon>
          </template>
          新增
        </el-button>

        <el-button
          type="primary"
          v-access:code="['sys:role:enable']"
          @click="enableRole()"
        >
          <template #icon>
            <el-icon><SwitchButton /></el-icon>
          </template>
          启用
        </el-button>

        <el-button
          type="danger"
          :disabled="roleIds.length === 0"
          v-access:code="['sys:role:disable']"
          @click="disableRole()"
        >
          <template #icon>
            <el-icon><SwitchButton /></el-icon>
          </template>
          禁用
        </el-button>

        <el-button
          type="danger"
          :disabled="roleIds.length === 0"
          v-access:code="['sys:role:delete']"
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
        :data="roleTableData"
        highlight-current-row
        :border="true"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        :default-sort="{ prop: 'sort', order: 'ascending' }"
        :height="tableHeight"
      >
        <el-table-column type="selection" width="80" align="center" />
        <el-table-column type="index" width="80" align="center" label="序号" />

        <el-table-column
          label="角色名称"
          prop="roleName"
          width="200"
          align="center"
        />

        <el-table-column
          label="角色编码"
          prop="roleCode"
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
              @click="openRoleMenuDrawer(scope.row.roleId, scope.row.roleName)"
              v-access:code="['sys:role:menu']"
            >
              <el-icon><Promotion /></el-icon>菜单授权
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              @click="openRoleUserDialog(scope.row.roleId, scope.row.roleName)"
              v-access:code="['sys:role:user']"
            >
              <el-icon><User /></el-icon>分配用户
            </el-button>

            <!-- 添加数据权限按钮 -->
            <el-button
              type="primary"
              size="small"
              link
              @click="openRoleDataPermissionDialog(scope.row.roleId, scope.row.roleName, scope.row.roleCode)"
              v-access:code="['sys:role:edit']"
            >
              <el-icon><Setting /></el-icon>数据权限
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:role:edit']"
              @click="openRoleDialog(scope.row.roleId)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:role:delete']"
              @click="handleDelete(scope.row.roleId)"
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

    <RoleFormDialog ref="roleFormDialogRef" @success="handleQuery" />

    <RoleMenuDrawer ref="roleMenuDialogRef" @success="resetQuery" />

    <RoleUserDialog ref="roleUserDialogRef" @success="resetQuery" />

    <RoleDataPermissionDialog ref="roleDataPermissionDialogRef" @success="resetQuery" />
  </div>
</template>
