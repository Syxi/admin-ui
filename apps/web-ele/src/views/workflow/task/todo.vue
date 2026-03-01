<template>
  <div class="workflow-todo">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">待办任务</h1>
      <div class="flex space-x-2">
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <el-form :inline="true" :model="queryParams" class="mb-4">
      <el-form-item label="流程名称">
        <el-input v-model="queryParams.processName" placeholder="请输入流程名称" clearable />
      </el-form-item>
      <el-form-item label="业务标题">
        <el-input v-model="queryParams.businessTitle" placeholder="请输入业务标题" clearable />
      </el-form-item>
      <el-form-item label="任务类型">
        <el-select v-model="queryParams.taskType" placeholder="请选择任务类型" clearable>
          <el-option label="审批任务" value="0" />
          <el-option label="抄送任务" value="1" />
          <el-option label="办理任务" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="todoList"
      style="width: 100%"
      border
    >
      <el-table-column prop="businessTitle" label="业务标题" min-width="200" />
      <el-table-column prop="processName" label="流程名称" width="150" />
      <el-table-column prop="nodeName" label="当前节点" width="150" />
      <el-table-column prop="applicantName" label="申请人" width="100" />
      <el-table-column prop="arriveTime" label="到达时间" width="180" />
      <el-table-column prop="dueTime" label="超时时间" width="180" />
      <el-table-column prop="isRead" label="状态" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.isRead === 1 ? 'success' : 'warning'">
            {{ scope.row.isRead === 1 ? '已读' : '未读' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleView(scope.row)">
            查看
          </el-button>
          <el-button size="small" type="primary" @click="handleApproval(scope.row)">
            处理
          </el-button>
          <el-button size="small" @click="handleMarkRead(scope.row)">
            标记已读
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-between items-center mt-4">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { workflowApi } from '@/api/workflow';
import { ElMessage } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const todoList = ref([]);
const total = ref(0);

const queryParams = reactive({
  page: 1,
  limit: 10,
  processName: '',
  businessTitle: '',
  taskType: undefined
});

// 加载待办任务列表
const loadTodoList = async () => {
  loading.value = true;
  try {
    const res = await workflowApi.task.getTodoPage(queryParams);
    todoList.value = res.data.list;
    total.value = res.data.total;
  } catch (error) {
    console.error('加载待办任务失败', error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleQuery = () => {
  queryParams.page = 1;
  loadTodoList();
};

// 重置
const resetQuery = () => {
  Object.assign(queryParams, {
    processName: '',
    businessTitle: '',
    taskType: undefined
  });
  handleQuery();
};

// 分页
const handleSizeChange = (size) => {
  queryParams.limit = size;
  loadTodoList();
};

const handleCurrentChange = (current) => {
  queryParams.page = current;
  loadTodoList();
};

// 刷新
const handleRefresh = () => {
  loadTodoList();
};

// 查看
const handleView = (row) => {
  router.push(`/workflow/task/handle/${row.id}`);
};

// 处理
const handleApproval = (row) => {
  router.push(`/workflow/task/handle/${row.id}`);
};

// 标记已读
const handleMarkRead = async (row) => {
  try {
    await workflowApi.task.markTaskAsRead(row.id);
    ElMessage.success('标记成功');
    loadTodoList();
  } catch (error) {
    console.error('标记失败', error);
    ElMessage.error('标记失败');
  }
};

onMounted(() => {
  loadTodoList();
});
</script>

<style scoped>
.workflow-todo {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
