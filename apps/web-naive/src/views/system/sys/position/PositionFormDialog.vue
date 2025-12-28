<script setup lang="ts">
import type { PositionForm } from '#/api/system/sys/position';

import { reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NTreeSelect, NRadioGroup, NRadio, NInputNumber, NModal, NButton, NSpace } from 'naive-ui';
import { message } from '#/adapter/naive';

import {
  addPositionApi,
  getPositionApi,
  updatePositionApi,
} from '#/api/system/sys/position';

const emit = defineEmits<{ (e: 'success'): void }>();

const positionFormRef = ref(NForm);

const loading = ref(false);

// 组织下拉选项树数据
const deptTreeOptionData = ref<any[]>([]);

const dialog = reactive({
  title: '',
  visible: false,
});

const formData = reactive<PositionForm>({
  sort: 1,
  status: 1,
  positionName: '',
});

const rules = reactive({
  positionName: [
    { required: true, message: '请输入岗位名称', trigger: 'blur' },
  ],
});

/**
 * 打开表单弹窗
 * @param positionId
 * @param deptTreeData
 */
async function openDialog(positionId?: string, deptTreeData?: any[]) {
  deptTreeOptionData.value = deptTreeData || [];
  dialog.visible = true;
  if (positionId) {
    dialog.title = '修改岗位';
    const data = await getPositionApi(positionId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增岗位';
  }
}

/**
 * 保存提交
 */
async function handleSubmit() {
  const valid = positionFormRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    const positionId = formData.positionId;
    await (positionId ? updatePositionApi(formData) : addPositionApi(formData));
    message.success(positionId ? '修改岗位成功' : '新增岗位成功');
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
  deptTreeOptionData.value = [];
  resetForm();
}

/**
 * 重置表单
 */
function resetForm() {
  positionFormRef.value.resetFields();
  positionFormRef.value.clearValidate();

  formData.positionId = undefined;
  formData.sort = 1;
  formData.status = 1;
}

defineExpose({ openDialog });
</script>
<template>
  <n-modal
    v-model:show="dialog.visible"
    :title="dialog.title"
    :bordered="false"
    size="huge"
    @close="closeDialog"
  >
    <n-spin :show="loading">
    <n-form
      ref="positionFormRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      :label-width="100"
      size="small"
    >
      <n-form-item label="岗位名称" path="positionName">
        <n-input
          v-model:value="formData.positionName"
          placeholder="请输入岗位名称"
        />
      </n-form-item>

      <n-form-item label="机构" path="deptId">
        <n-tree-select
          v-model:value="formData.deptId"
          :options="deptTreeOptionData"
          :default-expand-all="true"
          filterable
        />
      </n-form-item>

      <n-form-item label="状态" path="status">
        <n-radio-group v-model:value="formData.status">
          <n-radio :value="1">启用</n-radio>
          <n-radio :value="-1">禁用</n-radio>
        </n-radio-group>
      </n-form-item>

      <n-form-item label="排序" path="sort">
        <n-input-number v-model:value="formData.sort" :min="0" />
      </n-form-item>
    </n-form>
    </n-spin>

    <template #footer>
      <div class="dialog-footer">
        <n-space>
          <n-button @click="closeDialog">取消</n-button>
          <n-button type="primary" @click="handleSubmit">确定</n-button>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>
