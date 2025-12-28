<script setup lang="ts">
import type { ScheduledJobForm } from '#/api/system/log/scheduledJob';

import { reactive, ref } from 'vue';

import { NModal, NForm, NFormItem, NInput, NSelect, NButton } from 'naive-ui';
import { message } from '#/hooks';

import {
  addScheduledJobApi,
  getScheduledJobDetailApi,
  updateScheduledJobApi,
} from '#/api/system/log/scheduledJob';

const emit = defineEmits<{ (e: 'success'): void }>();

const scheduledJobFormRef = ref();

const jobClassNameOptions = ref<string[]>([]);

const loading = ref(false);

const dialog = reactive({
  title: '',
  visible: false,
});

const formData = reactive<ScheduledJobForm>({
  status: 1,
  jobName: '',
  jobClass: '',
  cronPopover: false,
});

const rules = reactive({
  jobName: [{ required: true, message: '请输入定时任务名称', trigger: 'blur' }],
  jobClass: [{ required: true, message: '请选择定时任务类', trigger: 'blur' }],
  cronExpression: [
    { required: true, message: '请选择cron表达式', trigger: 'blur' },
  ],
});

/**
 * 打开定时任务表单弹窗
 * @param jobId
 * @param jobClassName
 */
async function openDialog(jobId?: string, jobClassName?: string[]) {
  jobClassNameOptions.value = jobClassName || [];
  if (jobId) {
    dialog.title = '修改定时任务';
    const data = await getScheduledJobDetailApi(jobId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增定时任务';
  }
  dialog.visible = true;
}

/**
 * 定时任务保存提交
 */
async function handleSubmit() {
  const valid = await scheduledJobFormRef.value.validate();
  if (!valid) return;
  const jobId = formData.jobId;
  loading.value = true;
  try {
    await (jobId
      ? updateScheduledJobApi(formData)
      : addScheduledJobApi(formData));
    message.success(jobId ? '修改定时任务成功' : '新增定时任务成功');
    emit('success');
    closeDialog();
  } finally {
    loading.value = false;
  }
}

/**
 * 关闭表单弹窗
 */
function closeDialog() {
  dialog.visible = false;
  resetForm();
}

/**
 * 重置表单
 */
function resetForm() {
  scheduledJobFormRef.value.resetFields();
  scheduledJobFormRef.value.clearValidate();

  formData.jobId = undefined;
  formData.jobName = '';
  formData.cronExpression = '';
  formData.jobClass = '';
}

defineExpose({ openDialog });
</script>
<template>
  <NModal
    v-model:show="dialog.visible"
    :title="dialog.title"
    :show-icon="false"
    preset="dialog"
    style="width: 600px;"
    @close="closeDialog"
  >
    <div v-loading="loading"></div>
    <NForm
      ref="scheduledJobFormRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <NFormItem label="定时任务名称" path="jobName">
        <NInput v-model:value="formData.jobName" placeholder="请输入定时任务名称" />
      </NFormItem>

      <NFormItem label="定时任务类" path="jobClass">
        <NSelect v-model:value="formData.jobClass" placeholder="Select">
          <NSelect.Option
            v-for="item in jobClassNameOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </NSelect>
      </NFormItem>

      <NFormItem label="cron表达式" path="cronExpression">
        <NInput v-model:value="formData.cronExpression" placeholder="cron表达式" />
      </NFormItem>

      <NFormItem label="备注" path="remark">
        <NInput
          v-model:value="formData.remark"
          :rows="2"
          type="textarea"
          placeholder="备注"
        />
      </NFormItem>
    </NForm>

    <template #action>
      <div class="dialog-footer">
        <NButton @click="closeDialog">取消</NButton>
        <NButton type="primary" @click="handleSubmit">确定</NButton>
      </div>
    </template>
  </NModal>
</template>