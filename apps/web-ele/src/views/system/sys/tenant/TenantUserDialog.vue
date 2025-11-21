<script setup lang="ts">
import type { TransferKey } from 'element-plus';

import { ref } from 'vue';

import { ElMessage } from 'element-plus';

import { updateRoleUserApi } from '#/api/system/sys/role';
import { UserInRoleApi, userNotInRoleApi } from '#/api/system/sys/user';

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void;
}>();

const visible = ref(false);

const roleId = ref('');

const roleName = ref('');

// 角色分配用户弹出窗, 左侧数据
const usersNotInRole = ref<TransferVO[]>([]);

// 角色分配用户弹出窗, 右侧数据
const usersInRole = ref<TransferKey[]>([]);

/**
 * 打开分配用户弹窗
 */
async function openUserDialog(id: string, name: string) {
  visible.value = true;
  roleName.value = name;
  roleId.value = id;
  // 穿梭框左侧数据，获取不属于角色的用户列表
  await getUserListNotInRole(id);
  // 穿梭框右侧数据，获取属于角色的用户列表
  await getUserListInRole(id);
}

/**
 * 穿梭框左侧数据，获取不属于角色的用户列表
 */
async function getUserListNotInRole(roleId: string) {
  const data = await userNotInRoleApi(roleId);
  usersNotInRole.value = data;
}

/**
 * 穿梭框右侧数据，获取属于角色的用户列表
 * @param roleId
 */
async function getUserListInRole(roleId: string) {
  const data = await UserInRoleApi(roleId);
  // 获取到的key，转换为数组
  usersInRole.value = data.map((item) => item.key as TransferKey);
}

/**
 * 穿梭框右侧列表元素变化时触发，获取右侧列表的key
 */
function handleTransferChange(rightKey: TransferKey[]) {
  const userIds = rightKey.map(String);
  return userIds;
}

/**
 * 角色分配用用户， 更新角色用户关系
 */
function handleRoleUserSubmit() {
  const userIds = handleTransferChange(usersInRole.value);
  if (roleId.value) {
    updateRoleUserApi(roleId.value, userIds).then(() => {
      ElMessage.success('分配用户成功!');
      emit('success');
      visible.value = false;
      roleId.value = '';
    });
  }
}

defineExpose({ openUserDialog });
</script>
<template>
  <el-dialog
    draggable
    center
    v-model="visible"
    :title="roleName"
  >
    <div style="height: 600px; text-align: center">
      <el-transfer
        filterable
        :titles="['未分配用户列表', '已分配用户列表']"
        :button-texts="['移除', '添加']"
        :data="usersNotInRole"
        v-model="usersInRole"
        @change="handleTransferChange"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleRoleUserSubmit">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<style scoped>
/* 穿梭框宽度和高度调整 */
.el-transfer {
  --el-transfer-panel-width: 300px;
  --el-transfer-border-color: var(--el-border-color-lighter);
  --el-transfer-border-radius: var(--el-border-radius-base);
  /* stylelint-disable-next-line declaration-block-no-duplicate-custom-properties */
  --el-transfer-panel-width: 300px;
  --el-transfer-panel-header-height: 40px;
  --el-transfer-panel-header-bg-color: var(--el-fill-color-light);
  --el-transfer-panel-footer-height: 60px;
  --el-transfer-panel-body-height: 500px;
  --el-transfer-item-height: 30px;
  --el-transfer-filter-height: 32px;
}
</style>
