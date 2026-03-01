<template>
  <div class="workflow-instance-view">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">查看流程实例</h1>
      <el-button @click="handleBack">返回</el-button>
    </div>

    <el-card class="mb-4">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="业务标题">{{ instanceData.businessTitle }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ instanceData.businessType }}</el-descriptions-item>
        <el-descriptions-item label="业务Key">{{ instanceData.businessKey }}</el-descriptions-item>
        <el-descriptions-item label="流程名称">{{ instanceData.processName }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ instanceData.applicantName }}</el-descriptions-item>
        <el-descriptions-item label="当前节点">{{ instanceData.currentNodeName }}</el-descriptions-item>
        <el-descriptions-item label="当前处理人">{{ instanceData.currentAssigneeName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(instanceData.status)">{{ instanceData.statusName }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="结果" v-if="instanceData.result">
          <el-tag :type="instanceData.result === 1 ? 'success' : 'danger'">{{ instanceData.resultName }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ instanceData.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间" v-if="instanceData.endTime">{{ instanceData.endTime }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <div class="mb-4">
      <h2 class="text-lg font-semibold mb-2">审批轨迹</h2>
      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in approvalTrack"
          :key="index"
          :timestamp="item.createTime"
          :type="getTimelineType(item.type)"
        >
          <el-card>
            <h3 class="font-semibold">{{ item.nodeName }}</h3>
            <p class="text-gray-600">处理人：{{ item.assigneeName }}</p>
            <p v-if="item.comment" class="mt-2">备注：{{ item.comment }}</p>
            <p v-if="item.result" class="mt-2">
              结果：
              <el-tag :type="item.result === 1 ? 'success' : 'danger'">
                {{ item.result === 1 ? '通过' : '驳回' }}
              </el-tag>
            </p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>

    <div class="mb-4">
      <h2 class="text-lg font-semibold mb-2">流程变量</h2>
      <el-table v-if="instanceVariables.length > 0" :data="instanceVariables" border>
        <el-table-column prop="name" label="变量名" width="200" />
        <el-table-column prop="value" label="变量值" />
        <el-table-column prop="type" label="类型" width="120" />
      </el-table>
      <div v-else class="text-center py-4 text-gray-500">
        暂无流程变量
      </div>
    </div>

    <div class="flex justify-center">
      <el-button @click="handleBack">返回</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { workflowApi } from '@/api/workflow';
import { ElMessage } from 'element-plus';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const instanceData = reactive({
  id: undefined,
  businessTitle: '',
  businessType: '',
  businessKey: '',
  processName: '',
  applicantName: '',
  currentNodeName: '',
  currentAssigneeName: '',
  status: 0,
  statusName: '',
  result: undefined,
  resultName: '',
  startTime: '',
  endTime: ''
});
const approvalTrack = ref([]);
const instanceVariables = ref([]);

// 获取状态标签类型
const getStatusTagType = (status: number) => {
  switch (status) {
    case 0: return 'info';
    case 1: return 'success';
    case 2: return 'danger';
    case 3: return 'warning';
    default: return 'info';
  }
};

// 获取时间线类型
const getTimelineType = (type: string) => {
  switch (type) {
    case 'start': return 'primary';
    case 'complete': return 'success';
    case 'reject': return 'danger';
    case 'transfer': return 'warning';
    default: return 'info';
  }
};

// 加载流程实例详情
const loadInstanceDetail = async () => {
  const id = route.params.id;
  if (!id) {
    ElMessage.error('缺少流程实例ID');
    router.push('/workflow/instance');
    return;
  }
  try {
    const res = await workflowApi.instance.getInstanceById(Number(id));
    Object.assign(instanceData, res.data);
    // 加载审批轨迹
    await loadApprovalTrack(Number(id));
    // 加载流程变量
    await loadInstanceVariables(Number(id));
  } catch (error) {
    console.error('加载流程实例详情失败', error);
    ElMessage.error('加载失败');
  }
};

// 加载审批轨迹
const loadApprovalTrack = async (id: number) => {
  try {
    const res = await workflowApi.instance.getApprovalTrack(id);
    approvalTrack.value = res.data;
  } catch (error) {
    console.error('加载审批轨迹失败', error);
  }
};

// 加载流程变量
const loadInstanceVariables = async (id: number) => {
  try {
    const res = await workflowApi.instance.getInstanceVariables(id);
    // 转换变量格式为表格数据
    const variables = [];
    for (const [key, value] of Object.entries(res.data)) {
      variables.push({
        name: key,
        value: JSON.stringify(value),
        type: typeof value
      });
    }
    instanceVariables.value = variables;
  } catch (error) {
    console.error('加载流程变量失败', error);
  }
};

// 返回
const handleBack = () => {
  router.push('/workflow/instance');
};

onMounted(() => {
  loadInstanceDetail();
});
</script>

<style scoped>
.workflow-instance-view {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>