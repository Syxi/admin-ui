<template>
  <div class="workflow-definition-view">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">查看流程定义</h1>
      <el-button @click="handleBack">返回</el-button>
    </div>

    <el-card class="mb-4">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="流程名称">{{ definitionData.processName }}</el-descriptions-item>
        <el-descriptions-item label="流程Key">{{ definitionData.processKey }}</el-descriptions-item>
        <el-descriptions-item label="流程分类">{{ definitionData.category }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ definitionData.version }}</el-descriptions-item>
        <el-descriptions-item label="表单类型">{{ definitionData.formType === 1 ? '在线表单' : '自定义表单' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(definitionData.status)">{{ definitionData.statusName }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="表单ID" v-if="definitionData.formType === 1">{{ definitionData.formId }}</el-descriptions-item>
        <el-descriptions-item label="自定义表单URL" v-if="definitionData.formType === 2">{{ definitionData.formUrl }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ definitionData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ definitionData.updateTime }}</el-descriptions-item>
        <el-descriptions-item label="流程描述" :span="2">{{ definitionData.description }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <div class="mb-4">
      <h2 class="text-lg font-semibold mb-2">流程图</h2>
      <div v-if="diagramUrl" class="border rounded p-4">
        <img :src="diagramUrl" alt="流程图" class="max-w-full h-auto" />
      </div>
      <div v-else class="text-center py-8 text-gray-500">
        暂无流程图
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
const definitionData = reactive({
  id: undefined,
  processName: '',
  processKey: '',
  category: '',
  version: 0,
  formType: 1,
  formId: undefined,
  formUrl: '',
  status: 0,
  statusName: '',
  description: '',
  createTime: '',
  updateTime: ''
});
const diagramUrl = ref('');

// 获取状态标签类型
const getStatusTagType = (status: number) => {
  switch (status) {
    case 0: return 'info';
    case 1: return 'success';
    case 2: return 'warning';
    default: return 'info';
  }
};

// 加载流程定义详情
const loadDefinitionDetail = async () => {
  const id = route.params.id;
  if (!id) {
    ElMessage.error('缺少流程定义ID');
    router.push('/workflow/definition');
    return;
  }
  try {
    const res = await workflowApi.definition.getDefinitionById(Number(id));
    Object.assign(definitionData, res.data);
    // 加载流程图
    await loadDiagram(Number(id));
  } catch (error) {
    console.error('加载流程定义详情失败', error);
    ElMessage.error('加载失败');
  }
};

// 加载流程图
const loadDiagram = async (id: number) => {
  try {
    const res = await workflowApi.definition.getProcessDiagram(id);
    // 假设返回的是Base64编码的图片
    diagramUrl.value = `data:image/png;base64,${res.data}`;
  } catch (error) {
    console.error('加载流程图失败', error);
  }
};

// 返回
const handleBack = () => {
  router.push('/workflow/definition');
};

onMounted(() => {
  loadDefinitionDetail();
});
</script>

<style scoped>
.workflow-definition-view {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>