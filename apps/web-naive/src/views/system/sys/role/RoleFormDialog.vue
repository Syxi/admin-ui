<script setup lang="ts">
import type { RoleForm } from '#/api/system/sys/role';

import { defineEmits, defineExpose, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NRadioGroup, NRadioButton, NInputNumber, NButton, NModal, useMessage } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';

import { addRoleApi, editRoleApi, roleDetailApi } from '#/api/system/sys/role';

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 本地状态
const visible = ref(false);

const title = ref('');

const roleFormRef = ref();

const message = useMessage();

const formData = reactive<RoleForm>({
  roleId: '',
  roleCode: '',
  roleName: '',
  status: undefined,
  sort: undefined,
});

// 表单校验规则
const rules = {
  roleName: {
    required: true,
    message: '请输入角色名称',
    trigger: ['input', 'blur']
  },
  roleCode: {
    required: true,
    message: '请输入角色编码',
    trigger: ['input', 'blur']
  },
  status: {
    required: true,
    message: '请选择状态',
    trigger: ['blur', 'change']
  },
};

/**
 * 打开角色表单弹窗（暴露给 ref）
 * @param roleId 角色ID
 */
async function open(roleId?: string) {
  visible.value = true;
  title.value = roleId ? '修改角色' : '新增角色';
  if (roleId) {
    await getRoleFormData(roleId);
  }
}

/**
 * 关闭角色表单弹窗（暴露给 ref）
 */
function close() {
  visible.value = false;
  Object.keys(formData).forEach(key => {
    if (key in formData) {
      (formData as any)[key] = typeof (formData as any)[key] === 'number' ? 0 : '';
    }
  });
  formData.roleId = '';
}

/**
 * 获取角色数据
 * @param roleId 角色ID
 */
async function getRoleFormData(roleId: string) {
  const data = await roleDetailApi(roleId);
  Object.assign(formData, data);
}

/**
 * 角色保存提交
 */
const handleSubmit = async () => {

  const formRef = roleFormRef.value;
  try {
    await formRef?.validate();
    const roleId = formData.roleId;
    await (roleId ? editRoleApi(formData) : addRoleApi(formData));
    message.success(roleId ? '修改角色成功' : '新增角色成功');
    close();
    emit('success'); // 通知父组件刷新列表
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 暴露方法给 ref
defineExpose({ open, close });
</script>

<template>
  <!-- 弹窗主体 -->
  <n-modal v-model:show="visible" :title="title" :closable="true" :close-on-esc="true">
    <div class="dialog-wrapper">
      <n-card style="width: 500px;" :title="title" size="small" role="dialog" aria-modal="true">
        <n-form ref="roleFormRef" :model="formData" :rules="rules" label-placement="left" label-width="100px">
          <n-form-item label="角色名称" path="roleName">
            <n-input v-model:value="formData.roleName" placeholder="请输入角色名称" />
          </n-form-item>

          <n-form-item label="角色编码" path="roleCode">
            <n-input v-model:value="formData.roleCode" placeholder="请输入角色编码" />
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

        <!-- 底部按钮 -->
        <template #footer>
          <div class="dialog-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
            <n-button @click="close">取消</n-button>
            <n-button type="primary" @click="handleSubmit">
              确定
            </n-button>
          </div>
        </template>
      </n-card>
    </div>
  </n-modal>
</template>

<style scoped>
</style>
