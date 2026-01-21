<script setup lang="ts">
import type { PositionForm } from '#/api/system/sys/position';

import { reactive, ref } from 'vue';

import { ElForm, ElMessage } from 'element-plus';

import {
  addPositionApi,
  getPositionApi,
  updatePositionApi,
} from '#/api/system/sys/position';

const emit = defineEmits<{ (e: 'success'): void }>();

const positionFormRef = ref(ElForm);

const loading = ref(false);

// 组织下拉选项树数据
const deptTreeOptionData = ref<OptionType[]>([]);

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
  deptId: [{ required: true, message: '请选择机构', trigger: 'change' }],
});

/**
 * 打开表单弹窗
 * @param positionId
 * @param deptTreeData
 */
async function openDialog(positionId?: string, deptTreeData?: OptionType[]) {
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
    ElMessage.success(positionId ? '修改岗位成功' : '新增岗位成功');
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
  <el-dialog
    center
    draggable
    v-model="dialog.visible"
    :title="dialog.title"
    width="600px"
    @close="closeDialog"
  >
    <div v-loading="loading"></div>
    <ElForm
      ref="positionFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="岗位名称" prop="positionName">
        <el-input
          v-model="formData.positionName"
          placeholder="请输入岗位名称"
        />
      </el-form-item>

      <el-form-item label="机构" prop="deptId">
        <el-tree-select
          v-model="formData.deptId"
          :data="deptTreeOptionData"
          :default-expand-all="true"
          check-strictly
          filterable
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="-1">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" />
      </el-form-item>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
