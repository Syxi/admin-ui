<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  userNotInTenantPageApi,
  usersInTenantPageApi,
  updateTenantUsersApi
} from '#/api/system/sys/tenant';

interface TransferItem {
  key: string;
  label: string;
  realName?: string;
  disabled?: boolean;
}

type TransferKey = string | number;
type TransferDirection = 'left' | 'right';


const emit = defineEmits(['success']);

const dialogVisible = ref(false);
const submitLoading = ref(false);
const tenantId = ref('');
const tenantName = ref('');
const transferKey = ref(0); // 用于强制刷新穿梭框


const allUsers = ref<TransferItem[]>([]);
const selectedKeys = ref<string[]>([]);


// 打开对话框
function openUserDialog(id: string, name: string) {
  tenantId.value = id;
  tenantName.value = name;
  transferKey.value++; // 更新key以强制刷新穿梭框
  dialogVisible.value = true;
  handleQuery();
}

// 关闭对话框
function closeDialog() {
  dialogVisible.value = false;
  allUsers.value = [];
  selectedKeys.value = [];
  tenantId.value = '';
  tenantName.value = '';
  
  // 无需手动清空搜索条件，因为组件会在下次打开时重新创建
}

// 查询数据
async function handleQuery() {
  try {
    // 获取已分配的用户
    const usersInTenant = await usersInTenantPageApi(tenantId.value, 1, 1000);

    // 获取未分配的用户
    const userNotInTenant = await userNotInTenantPageApi(tenantId.value, 1, 1000);

    const assigned = usersInTenant.list;
    const unassigned = userNotInTenant.list;

    // 合并所有用户（确保 key 唯一）
    allUsers.value = [...assigned, ...unassigned];

    // 提取已分配用户的 key 作为选中项
    selectedKeys.value = assigned.map(item => item.key);

  } catch (error) {
    console.error('获取用户数据失败:', error);
    ElMessage.error('获取用户数据失败');
  }
}

// 监听穿梭框变化
const handleChange = (
  value: TransferKey[],
  direction: TransferDirection,
  movedKeys: TransferKey[]
) => {
  console.log(value, direction, movedKeys)
}

// 确认保存
async function confirmSave() {
  try {
    // 调用API更新租户用户关系
    await updateTenantUsersApi(tenantId.value, selectedKeys.value);

    ElMessage.success('分配用户成功');
    emit('success');
    closeDialog();
  } catch (error) {
    console.error('分配用户失败:', error);
    ElMessage.error('分配用户失败');
  }
}

defineExpose({
  openUserDialog
});
</script>

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
  --el-transfer-panel-body-height: 550px;
  --el-transfer-item-height: 30px;
  --el-transfer-filter-height: 32px;
}
</style>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`${tenantName} - 分配用户`"
    @close="closeDialog"
    center
    draggable
  >
    <!-- 穿梭框 -->
    <div style="display: flex; height: 600px">
      <el-transfer
        :key="transferKey"
        v-model="selectedKeys"
        :data="allUsers"
        :titles="['未分配用户', '已分配用户']"
        :button-texts="['移除', '添加']"
        filterable
        filter-placeholder="请输入用户名"
        :props="{
            key: 'key',
            label: 'label',
            disabled: 'disabled'
          }"
        @change="handleChange"
      >
<!--        <template #default="{ option }">-->
<!--          <span>{{ option.label }}</span>-->
<!--          <span style="color: #8492a6; font-size: 13px; margin-left: 10px">{{ option.realName }}</span>-->
<!--        </template>-->
      </el-transfer>
    </div>

    <template #footer>
      <div >
        <el-button @click="closeDialog">取 消</el-button>
        <el-button type="primary" @click="confirmSave">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
