<template>
  <div class="tenant-switch">
    <el-dropdown @command="handleTenantSwitch" placement="bottom">
      <span class="tenant-dropdown-link">
        <span class="tenant-name">{{ currentTenantName || '未选择租户' }}</span>
        <el-icon class="el-icon--right">
          <arrow-down />
        </el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="tenant in tenantList"
            :key="tenant.id"
            :command="tenant.id"
            :class="{ 'is-active': tenant.id === currentTenantId }"
          >
            {{ tenant.name }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { getUserTenantsApi, switchTenantApi } from '#/api/system/sys/tenantUser';
import { useUserStore } from '@vben/stores';

interface Tenant {
  id: string;
  name: string;
}

const tenantList = ref<Tenant[]>([]);
const userStore = useUserStore();
const currentTenantId = computed(() => userStore.userInfo?.tenantId);
const currentTenantName = computed(() => userStore.userInfo?.tenantName);

const loadTenantList = async () => {
  try {
    const response = await getUserTenantsApi();
    tenantList.value = response.data.map((item: any) => ({
      id: item.tenantId,
      name: item.tenantName || `租户${item.tenantId}`,
    }));
  } catch (error) {
    console.error('获取租户列表失败:', error);
    ElMessage.error('获取租户列表失败');
  }
};

const handleTenantSwitch = async (tenantId: string) => {
  try {
    await ElMessageBox.confirm('确定要切换到此租户吗？切换后将重新加载页面', '切换租户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await switchTenantApi(tenantId);
    
    // 更新用户信息中的租户信息
    const userInfo = { ...userStore.userInfo, tenantId };
    userStore.setUserInfo(userInfo);
    
    ElMessage.success('租户切换成功');
    
    // 刷新页面以确保所有数据都基于新租户
    window.location.reload();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换租户失败:', error);
      ElMessage.error('切换租户失败');
    }
  }
};

onMounted(() => {
  loadTenantList();
});
</script>

<style scoped>
.tenant-switch {
  display: inline-block;
}

.tenant-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 2px 4px;
}

.tenant-name {
  margin-right: 4px;
}

.tenant-dropdown-link:hover {
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
</style>