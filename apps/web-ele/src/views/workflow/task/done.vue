<template>
  <div class="workflow-done">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">已办任务</h1>
    </div>

    <el-form :inline="true" :model="queryParams" class="mb-4">
      <el-form-item label="流程名称">
        <el-input v-model="queryParams.processName" placeholder="请输入流程名称" clearable />
      </el-form-item>
      <el-form-item label="业务标题">
        <el-input v-model="queryParams.businessTitle" placeholder="请输入业务标题" clearable />
      </el-form-item>
      <el-form-item label="处理结果">
        <el-select v-model="queryParams.status" placeholder="请选择处理结果" clearable>
          <el-option label="已处理" value="1" />
          <el-option label="已转办" value="2" />
          <el-option label="已委派" value="3" />
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
      :data="doneList"
      style="width: 100%"
      border
    >
      <el-table-column prop="businessTitle" label="业务标题" min-width="200" />
      <el-table-column prop="processName" label="流程名称" width="150" />
      <el-table-column prop="nodeName" label="处理节点" width="150" />
      <el-table-column prop="applicantName" label="申请人" width="100" />
      <el-table-column prop="arriveTime" label="到达时间" width="180" />
      <el-table-column prop="handleTime" label="处理时间" width="180" />
      <el-table-column prop="durationText" label="处理时长" width="120" />
      <el-table-column prop="result" label="处理结果" width="100">
        <template #default="scope">
          <el-tag
            :type="scope.row.result === 1 ? 'success' : 'danger'"
          >
            {{ scope.row.resultName }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="comment" label="处理意见" min-width="150" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleView(scope.row)">
            查看
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
import { Search, Refresh } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const doneList = ref([]);
const total = ref(0);

const queryParams = reactive({
  page: 1,
  limit: 10,
  processName: '',
  businessTitle: '',
  status: undefined
});

// 加载已办任务列表
const loadDoneList = async () => {
  loading.value = true;
  try {
    const res = await workflowApi.task.getDonePage(queryParams);
    doneList.value = res.data.list;
    total.value = res.data.total;
  } catch (error) {
    console.error('加载已办任务失败', error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleQuery = () => {
  queryParams.page = 1;
  loadDoneList();
};

// 重置
const resetQuery = () => {
  Object.assign(queryParams, {
    processName: '',
    businessTitle: '',
    status: undefined
  });
  handleQuery();
};

// 分页
const handleSizeChange = (size) => {
  queryParams.limit = size;
  loadDoneList();
};

const handleCurrentChange = (current) => {
  queryParams.page = current;
  loadDoneList();
};

// 查看
const handleView = (row) => {
  router.push(`/workflow/task/handle/${row.id}`);
};

onMounted(() => {
  loadDoneList();
});
</script>

<style scoped>
.workflow-done {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
