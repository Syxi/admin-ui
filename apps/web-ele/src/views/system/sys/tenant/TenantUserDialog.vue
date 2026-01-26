<script setup lang="ts">
import { ref } from 'vue';

import { ElMessage } from 'element-plus';

import { updateTenantUsersApi, usersInTenantPageApi, userNotInTenantPageApi, addUserToTenantApi, removeUserFromTenantApi } from '#/api/system/sys/tenant';

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void;
}>();

const visible = ref(false);

const tenantId = ref('');

const tenantName = ref('');

// 左侧表格数据（不属于租户的用户）
const leftTableData = ref<TransferVO[]>([]);
const leftLoading = ref(false);
const leftTotal = ref(0);
const leftCurrentPage = ref(1);
const leftPageSize = ref(10);
// 左侧搜索关键词
const leftSearchKeyword = ref('');

// 右侧表格数据（属于租户的用户）
const rightTableData = ref<TransferVO[]>([]);
const rightLoading = ref(false);
const rightTotal = ref(0);
const rightCurrentPage = ref(1);
const rightPageSize = ref(10);
// 右侧搜索关键词
const rightSearchKeyword = ref('');

/**
 * 打开分配用户弹窗
 */
async function openUserDialog(id: string, name: string) {
  visible.value = true;
  tenantName.value = name;
  tenantId.value = id;
  
  // 重置分页和搜索关键词
  leftCurrentPage.value = 1;
  leftSearchKeyword.value = '';
  rightCurrentPage.value = 1;
  rightSearchKeyword.value = '';
  
  // 加载数据
  await loadLeftTableData();
  await loadRightTableData();
}

/**
 * 加载左侧表格数据（不属于租户的用户）
 */
async function loadLeftTableData() {
  leftLoading.value = true;
  try {
    const response = await userNotInTenantPageApi(
      tenantId.value, 
      leftCurrentPage.value, 
      leftPageSize.value,
      leftSearchKeyword.value  // 添加搜索关键词参数
    );
    leftTableData.value = response.records;
    leftTotal.value = response.total;
  } finally {
    leftLoading.value = false;
  }
}

/**
 * 加载右侧表格数据（属于租户的用户）
 */
async function loadRightTableData() {
  rightLoading.value = true;
  try {
    const response = await usersInTenantPageApi(
      tenantId.value, 
      rightCurrentPage.value, 
      rightPageSize.value,
      rightSearchKeyword.value  // 添加搜索关键词参数
    );
    rightTableData.value = response.records;
    rightTotal.value = response.total;
  } finally {
    rightLoading.value = false;
  }
}

/**
 * 左侧表格分页变化
 */
function handleLeftPaginationChange(page: number) {
  leftCurrentPage.value = page;
  loadLeftTableData();
}

/**
 * 左侧表格每页数量变化
 */
function handleLeftSizeChange(size: number) {
  leftPageSize.value = size;
  leftCurrentPage.value = 1;
  loadLeftTableData();
}

/**
 * 右侧表格分页变化
 */
function handleRightPaginationChange(page: number) {
  rightCurrentPage.value = page;
  loadRightTableData();
}

/**
 * 右侧表格每页数量变化
 */
function handleRightSizeChange(size: number) {
  rightPageSize.value = size;
  rightCurrentPage.value = 1;
  loadRightTableData();
}

/**
 * 左侧搜索
 */
function handleLeftSearch() {
  leftCurrentPage.value = 1;  // 重置到第一页
  loadLeftTableData();
}

/**
 * 右侧搜索
 */
function handleRightSearch() {
  rightCurrentPage.value = 1;  // 重置到第一页
  loadRightTableData();
}

/**
 * 添加单个用户到租户
 */
async function handleAddSingleUser(row: TransferVO) {
  try {
    // 使用新的API直接添加单个用户
    const result = await addUserToTenantApi(tenantId.value, row.key.toString());
    
    if (result) {
      ElMessage.success('添加用户成功');
      
      // 重新加载数据 - 重要：确保添加用户后立即更新显示
      // 使用Promise.all同时更新两个表格的数据，提高效率
      await Promise.all([
        loadLeftTableData(),   // 左侧数据应该更新（该用户不再属于"非此租户"）
        loadRightTableData()   // 右侧数据应该更新（该用户现在属于"此租户"）
      ]);
    }
  } catch (error) {
    console.error('添加用户失败:', error);
    ElMessage.error('添加用户失败');
  }
}

/**
 * 从租户移除单个用户
 */
async function handleRemoveSingleUser(row: TransferVO) {
  try {
    // 直接移除用户，不需要确认
    const result = await removeUserFromTenantApi(tenantId.value, row.key.toString());
    
    if (result) {
      ElMessage.success('移除用户成功');
      
      // 重新加载数据 - 重要：确保移除用户后立即更新显示
      // 使用Promise.all同时更新两个表格的数据，提高效率
      await Promise.all([
        loadLeftTableData(),   // 左侧数据应该更新（该用户现在属于"非此租户"）
        loadRightTableData()   // 右侧数据应该更新（该用户不再属于"此租户"）
      ]);
    }
  } catch (error) {
    console.error('移除用户失败:', error);
    ElMessage.error('移除用户失败');
  }
}

defineExpose({ openUserDialog });
</script>

<template>
  <el-dialog
    draggable
    v-model="visible"
    :title="`${tenantName} - 分配用户`"
    width="80%"
    top="5vh"
    center
  >
    <div style="display: flex; gap: 20px;">
      <!-- 左侧表格 - 不属于租户的用户 -->
      <div style="flex: 1;">
        <div style="display: flex; margin-bottom: 10px; gap: 10px; align-items: center;">
          <h4>不属于该租户的用户</h4>
          <el-input
            v-model="leftSearchKeyword"
            placeholder="搜索用户名/真实姓名"
            style="width: 200px;"
            @keyup.enter="handleLeftSearch"
            clearable
          />
          <el-button type="primary" @click="handleLeftSearch">搜索</el-button>
        </div>
        
        <el-table
          v-loading="leftLoading"
          :data="leftTableData"
          height="400px"
          border
        >
          <el-table-column prop="label" label="用户名" show-overflow-tooltip />
          <el-table-column prop="realName" label="真实姓名" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleAddSingleUser(row)">
                添加
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-pagination
          v-if="leftTotal > 0"
          v-model:current-page="leftCurrentPage"
          v-model:page-size="leftPageSize"
          :total="leftTotal"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          style="margin-top: 10px;"
          @size-change="handleLeftSizeChange"
          @current-change="handleLeftPaginationChange"
        />
      </div>

      <!-- 右侧表格 - 属于租户的用户 -->
      <div style="flex: 1;">
        <div style="display: flex; margin-bottom: 10px; gap: 10px; align-items: center;">
          <h4>属于该租户的用户</h4>
          <el-input
            v-model="rightSearchKeyword"
            placeholder="搜索用户名/真实姓名"
            style="width: 200px;"
            @keyup.enter="handleRightSearch"
            clearable
          />
          <el-button type="primary" @click="handleRightSearch">搜索</el-button>
        </div>
        
        <el-table
          v-loading="rightLoading"
          :data="rightTableData"
          height="400px"
          border
        >
          <el-table-column prop="label" label="用户名" show-overflow-tooltip />
          <el-table-column prop="realName" label="真实姓名" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" size="small" @click="handleRemoveSingleUser(row)">
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-pagination
          v-if="rightTotal > 0"
          v-model:current-page="rightCurrentPage"
          v-model:page-size="rightPageSize"
          :total="rightTotal"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          style="margin-top: 10px;"
          @size-change="handleRightSizeChange"
          @current-change="handleRightPaginationChange"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>