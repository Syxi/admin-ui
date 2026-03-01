<template>
  <div class="workflow-task-handle">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">任务处理</h1>
      <el-button @click="handleBack">返回</el-button>
    </div>

    <el-card class="mb-4">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="业务标题">{{ taskData.businessTitle }}</el-descriptions-item>
        <el-descriptions-item label="流程名称">{{ taskData.processName }}</el-descriptions-item>
        <el-descriptions-item label="当前节点">{{ taskData.nodeName }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ taskData.applicantName }}</el-descriptions-item>
        <el-descriptions-item label="到达时间">{{ taskData.arriveTime }}</el-descriptions-item>
        <el-descriptions-item label="超时时间">{{ taskData.dueTime }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <div class="mb-4">
      <h2 class="text-lg font-semibold mb-2">表单数据</h2>
      <div v-if="formData" class="border rounded p-4">
        <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
      </div>
      <div v-else class="text-center py-4 text-gray-500">
        暂无表单数据
      </div>
    </div>

    <div class="mb-4">
      <h2 class="text-lg font-semibold mb-2">审批操作</h2>
      <el-form :model="approvalForm" :rules="approvalRules" ref="approvalFormRef" label-width="120px">
        <el-form-item label="审批结果" prop="result">
          <el-radio-group v-model="approvalForm.result">
            <el-radio label="1">通过</el-radio>
            <el-radio label="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见" prop="comment">
          <el-input v-model="approvalForm.comment" type="textarea" placeholder="请输入审批意见" />
        </el-form-item>
        <el-form-item label="转办人" v-if="showTransfer">
          <el-select v-model="approvalForm.assignee" placeholder="请选择转办人">
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <div class="flex justify-center space-x-4">
      <el-button @click="handleBack">返回</el-button>
      <el-button @click="handleTransfer">转办</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { workflowApi } from '@/api/workflow';
import { ElMessage, ElForm, ElMessageBox } from 'element-plus';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const taskData = reactive({
  id: undefined,
  businessTitle: '',
  processName: '',
  nodeName: '',
  applicantName: '',
  arriveTime: '',
  dueTime: ''
});
const formData = ref(null);
const users = ref([]);
const showTransfer = ref(false);
const approvalFormRef = ref<InstanceType<typeof ElForm>>();

const approvalForm = reactive({
  result: '1',
  comment: '',
  assignee: undefined
});

const approvalRules = {
  result: [{ required: true, message: '请选择审批结果', trigger: 'change' }],
  comment: [{ required: true, message: '请输入审批意见', trigger: 'blur' }],
  assignee: [{ required: showTransfer.value, message: '请选择转办人', trigger: 'change' }]
};

// 加载任务详情
const loadTaskDetail = async () => {
  const id = route.params.id;
  if (!id) {
    ElMessage.error('缺少任务ID');
    router.push('/workflow/todo');
    return;
  }
  try {
    const res = await workflowApi.task.getTaskById(Number(id));
    Object.assign(taskData, res.data);
    // 加载表单数据
    await loadTaskFormData(Number(id));
    // 加载用户列表（用于转办）
    await loadUsers();
  } catch (error) {
    console.error('加载任务详情失败', error);
    ElMessage.error('加载失败');
  }
};

// 加载表单数据
const loadTaskFormData = async (taskId: number) => {
  try {
    const res = await workflowApi.task.getTaskFormData(taskId);
    formData.value = res.data;
  } catch (error) {
    console.error('加载表单数据失败', error);
  }
};

// 加载用户列表
const loadUsers = async () => {
  // 这里应该调用用户API获取用户列表，暂时模拟数据
  users.value = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
    { id: 3, name: '王五' }
  ];
};

// 提交审批
const handleSubmit = async () => {
  if (!approvalFormRef.value) return;
  await approvalFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (showTransfer.value) {
          // 转办任务
          await workflowApi.task.transferTask({
            taskId: taskData.id,
            assigneeId: approvalForm.assignee,
            comment: approvalForm.comment
          });
          ElMessage.success('转办成功');
        } else {
          // 审批任务
          if (approvalForm.result === '1') {
            // 审批通过
            await workflowApi.task.completeTask({
              taskId: taskData.id,
              comment: approvalForm.comment
            });
          } else {
            // 审批驳回
            await workflowApi.task.rejectTask({
              taskId: taskData.id,
              comment: approvalForm.comment
            });
          }
          ElMessage.success('审批成功');
        }
        router.push('/workflow/todo');
      } catch (error) {
        console.error('提交失败', error);
        ElMessage.error('提交失败');
      }
    }
  });
};

// 转办
const handleTransfer = () => {
  showTransfer.value = !showTransfer.value;
  if (!showTransfer.value) {
    approvalForm.assignee = undefined;
  }
};

// 返回
const handleBack = () => {
  router.push('/workflow/todo');
};

onMounted(() => {
  loadTaskDetail();
});
</script>

<style scoped>
.workflow-task-handle {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>