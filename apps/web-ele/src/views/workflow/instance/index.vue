<template>
  <div class="workflow-instance">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">流程实例管理</h1>
      <div class="flex space-x-2">
        <el-button type="primary" @click="handleStartProcess">
          <el-icon><Play /></el-icon>
          启动流程
        </el-button>
      </div>
    </div>

    <el-form :inline="true" :model="queryParams" class="mb-4">
      <el-form-item label="业务标题">
        <el-input v-model="queryParams.businessTitle" placeholder="请输入业务标题" clearable />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="运行中" value="0" />
          <el-option label="已完成" value="1" />
          <el-option label="已终止" value="2" />
          <el-option label="已挂起" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="queryParams.result" placeholder="请选择结果" clearable>
          <el-option label="审批中" value="0" />
          <el-option label="已通过" value="1" />
          <el-option label="已驳回" value="2" />
          <el-option label="已终止" value="3" />
          <el-option label="已撤回" value="4" />
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
      :data="instanceList"
      style="width: 100%"
      border
    >
      <el-table-column prop="businessTitle" label="业务标题" min-width="200" />
      <el-table-column prop="businessType" label="业务类型" width="120" />
      <el-table-column prop="businessKey" label="业务Key" width="150" />
      <el-table-column prop="applicantName" label="申请人" width="100" />
      <el-table-column prop="currentNodeName" label="当前节点" width="150" />
      <el-table-column prop="currentAssigneeName" label="当前处理人" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag
            :type="getTagType(scope.row.status)"
          >
            {{ scope.row.statusName }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="result" label="结果" width="100">
        <template #default="scope">
          <el-tag
            v-if="scope.row.result"
            :type="scope.row.result === 1 ? 'success' : 'danger'"
          >
            {{ scope.row.resultName }}
          </el-tag>
          <el-tag v-else type="info">
            审批中
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" width="180" />
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleView(scope.row)">
            查看
          </el-button>
          <el-button
            size="small"
            type="primary"
            v-if="scope.row.status === 0"
            @click="handleTerminate(scope.row)"
          >
            终止
          </el-button>
          <el-button
            size="small"
            v-if="scope.row.status === 0"
            @click="handleSuspend(scope.row)"
          >
            挂起
          </el-button>
          <el-button
            size="small"
            v-if="scope.row.status === 3"
            @click="handleActivate(scope.row)"
          >
            激活
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { Play, Search, Refresh } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const instanceList = ref([]);
const total = ref(0);

const queryParams = reactive({
  page: 1,
  limit: 10,
  businessTitle: '',
  status: undefined,
  result: undefined
});

// 获取标签类型
const getTagType = (status) => {
  switch (status) {
    case 0: return 'info';
    case 1: return 'success';
    case 2: return 'danger';
    case 3: return 'warning';
    default: return 'info';
  }
};

// 加载流程实例列表
const loadInstances = async () => {
  loading.value = true;
  try {
    const res = await workflowApi.instance.getInstancePage(queryParams);
    instanceList.value = res.data.list;
    total.value = res.data.total;
  } catch (error) {
    console.error('加载流程实例失败', error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleQuery = () => {
  queryParams.page = 1;
  loadInstances();
};

// 重置
const resetQuery = () => {
  Object.assign(queryParams, {
    businessTitle: '',
    status: undefined,
    result: undefined
  });
  handleQuery();
};

// 分页
const handleSizeChange = (size) => {
  queryParams.limit = size;
  loadInstances();
};

const handleCurrentChange = (current) => {
  queryParams.page = current;
  loadInstances();
};

// 启动流程
const handleStartProcess = () => {
  router.push('/workflow/instance/start');
};

// 查看
const handleView = (row) => {
  router.push(`/workflow/instance/view/${row.id}`);
};

// 终止
const handleTerminate = async (row) => {
  try {
    await ElMessageBox.confirm('确定要终止该流程实例吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await workflowApi.instance.terminateInstance(row.id, '手动终止');
    ElMessage.success('终止成功');
    loadInstances();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('终止失败', error);
      ElMessage.error('终止失败');
    }
  }
};

// 挂起
const handleSuspend = async (row) => {
  try {
    await ElMessageBox.confirm('确定要挂起该流程实例吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await workflowApi.instance.suspendInstance(row.id);
    ElMessage.success('挂起成功');
    loadInstances();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('挂起失败', error);
      ElMessage.error('挂起失败');
    }
  }
};

// 激活
const handleActivate = async (row) => {
  try {
    await ElMessageBox.confirm('确定要激活该流程实例吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await workflowApi.instance.activateInstance(row.id);
    ElMessage.success('激活成功');
    loadInstances();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('激活失败', error);
      ElMessage.error('激活失败');
    }
  }
};

onMounted(() => {
  loadInstances();
});
</script>

<style scoped>
.workflow-instance {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
