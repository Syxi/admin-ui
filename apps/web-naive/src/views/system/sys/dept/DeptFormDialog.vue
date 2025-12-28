<script setup lang="ts">
import type { DeptForm } from '#/api/system/sys/dept';

import { reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NRadioGroup, NRadio, NInputNumber, NTreeSelect, NButton, NDialog, useMessage } from 'naive-ui';

import {
  addDeptApi,
  editDeptApi,
  getDeptDetailApi,
} from '#/api/system/sys/dept';

const emit = defineEmits<{ (e: 'success'): void }>();
// 加载状态
const loading = ref(false);

// 弹出窗组织表单
const orgFormRef = ref();

// 组织表单数据
const formData = reactive<DeptForm>({
  status: 1,
});

const rules = reactive({
  deptName: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  deptCode: [{ required: true, message: '编码不能为空', trigger: 'blur' }],
  deptType: [{ required: true, message: '类型不能为空', trigger: 'blur' }],
  // parentId 验证规则根据实际情况调整
  parentId: [
    {
      validator: (rule: any, value: string, callback: any) => {
        // 如果是编辑状态或者是顶级机构（parentId为'0'），则不需要验证
        if (formData.id || value === '0') {
          callback();
        } else if (!value) {
          callback(new Error('上级机构不能为空'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
});

// 新增或编辑机构，弹出窗
const dialog = reactive({
  visible: false,
  title: '',
  type: '',
  width: 600,
});

// 组织下拉选项树数据
const deptTreeOptionData = ref<any[]>([]);

/**
 * 新增或编辑机构，打开弹出窗
 */
async function openDialog(
  id?: string,
  parentId?: string,
  deptTreeData?: any[],
) {
  deptTreeOptionData.value = deptTreeData || [];

  dialog.visible = true;
  if (id) {
    dialog.title = '修改';
    const data = await getDeptDetailApi(id);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增';
    // 确保 parentId 正确设置，如果是顶级机构则设置为 '0'
    formData.parentId = parentId !== undefined ? parentId : '0';
  }
}

/**
 * 新增或编辑机构，关闭弹出窗
 */
function handleCloseDialog() {
  orgFormRef.value.resetFields();
  orgFormRef.value.clearValidate();
  formData.id = undefined;
  deptTreeOptionData.value = [];
  dialog.visible = false;
}

/**
 * 提交表单
 * @param deptId
 */
async function handleSubmit() {
  const valid = orgFormRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    const id = formData.id;
    await (id ? editDeptApi(formData) : addDeptApi(formData));
    const message = useMessage();
    message.success(id ? '修改成功！' : '新增成功');
    handleCloseDialog();
    emit('success');
  } finally {
    loading.value = false;
  }
}

defineExpose({ openDialog });
</script>
<template>
  <NDialog
    v-model:show="dialog.visible"
    :title="dialog.title"
    :style="{ width: dialog.width + 'px' }"
    @close="handleCloseDialog()"
  >
    <NForm
      ref="orgFormRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
    >
      <NFormItem
        label="上级机构"
        path="parentId"
      >
        <NTreeSelect
          v-model:value="formData.parentId"
          :options="deptTreeOptionData"
          filterable
          :default-expand-all="true"
        />
      </NFormItem>

      <NFormItem path="deptName" label="名称">
        <NInput v-model:value="formData.deptName" placeholder="名称" />
      </NFormItem>

      <NFormItem path="deptCode" label="编码">
        <NInput v-model:value="formData.deptCode" placeholder="编码" />
      </NFormItem>

      <NFormItem label="类型" path="deptType">
        <NRadioGroup v-model:value="formData.deptType">
          <NRadio :value="1">机构</NRadio>
          <NRadio :value="2">部门</NRadio>
        </NRadioGroup>
      </NFormItem>

      <NFormItem label="排序" path="sort">
        <NInputNumber v-model:value="formData.sort" :min="0" />
      </NFormItem>

      <NFormItem label="状态" path="status">
        <NRadioGroup v-model:value="formData.status">
          <NRadio :value="1">启用</NRadio>
          <NRadio :value="-1">禁用</NRadio>
        </NRadioGroup>
      </NFormItem>
    </NForm>

    <template #footer>
      <div class="dialog-footer">
        <NButton type="primary" @click="handleCloseDialog()">
          取消
        </NButton>
        <NButton type="primary" @click="handleSubmit()">确定</NButton>
      </div>
    </template>
  </NDialog>
</template>
