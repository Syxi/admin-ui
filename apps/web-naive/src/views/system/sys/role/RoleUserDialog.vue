<script setup lang="ts">
import type { TransferOption } from 'naive-ui';

import { ref } from 'vue';

import { NModal, NTransfer, NButton, useMessage } from 'naive-ui';

import { updateRoleUserApi } from '#/api/system/sys/role';
import { UserInRoleApi, userNotInRoleApi } from '#/api/system/sys/user';
import { useAuthStore } from '#/store';
import { useAccessStore } from '@vben/stores';
import { generateAccess } from '#/router/access';
import { router } from '#/router';
import { accessRoutes } from '#/router/routes';

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void;
}>();

const visible = ref(false);

const roleId = ref('');

const roleName = ref('');

// 获取store实例
const authStore = useAuthStore();
const accessStore = useAccessStore();

// 角色分配用户弹出窗, 左侧数据
const usersNotInRole = ref<any[]>([]);

// 角色分配用户弹出窗, 右侧数据
const usersInRole = ref<string[]>([]);

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
  usersInRole.value = data.map((item) => item.key as string);
}

/**
 * 穿梭框右侧列表元素变化时触发，获取右侧列表的key
 */
function handleTransferChange(rightKey: string[]) {
  const userIds = rightKey.map(String);
  return userIds;
}

/**
 * 角色分配用用户， 更新角色用户关系
 */
function handleRoleUserSubmit() {
  const userIds = handleTransferChange(usersInRole.value);
  if (roleId.value) {
    updateRoleUserApi(roleId.value, userIds).then(async () => {
      const message = useMessage();
      message.success('分配用户成功!');
      
      // 角色分配用户后，重新获取用户信息并更新菜单路由
      try {
        // 重新获取用户信息
        await authStore.fetchUserInfo();
        
        // 重新生成菜单和路由
        const { accessibleMenus, accessibleRoutes } = await generateAccess({
          router,
          roles: [],
          routes: accessRoutes
        });
        
        // 更新accessStore中的菜单和路由
        accessStore.setAccessMenus(accessibleMenus);
        accessStore.setAccessRoutes(accessibleRoutes);
        accessStore.setIsAccessChecked(true);
      } catch (error) {
        console.error('更新用户信息和菜单路由失败:', error);
      }
      
      emit('success');
      visible.value = false;
      roleId.value = '';
    });
  }
}

defineExpose({ openUserDialog });
</script>
<template>
  <n-modal v-model:show="visible" :title="roleName" :closable="true" :close-on-esc="true">
    <div class="dialog-wrapper">
      <n-card style="width: 800px;" :title="roleName" size="small" role="dialog" aria-modal="true">
        <div style="height: 600px; text-align: center">
          <n-transfer
            v-model:value="usersInRole"
            :options="usersNotInRole"
            :titles="['未分配用户列表', '已分配用户列表']"
            :button-texts="['移除', '添加']"
            filterable
            @update:value="handleTransferChange"
          />
        </div>
        <template #footer>
          <div class="dialog-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
            <n-button @click="visible = false">取消</n-button>
            <n-button type="primary" @click="handleRoleUserSubmit">确定</n-button>
          </div>
        </template>
      </n-card>
    </div>
  </n-modal>
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