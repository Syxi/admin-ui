<script setup lang="ts">
import type { FormRules } from 'naive-ui';

import type { RoleForm } from '#/api/system/sys/role';

import { defineEmits, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NSelect, NButton, useMessage, NModal } from 'naive-ui';

import { h } from 'vue';

const message = useMessage();

import { roleDetailApi, updateRoleDataScopeApi } from '#/api/system/sys/role';
import { useAuthStore } from '#/store';

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 本地状态
const visible = ref(false);

const title = ref('');

// 获取authStore实例
const authStore = useAuthStore();

const roleFormRef = ref();

// 定义表单数据结构（添加roleCode字段）
const formData = reactive({
  roleId: '',
  roleCode: '',
  roleName: '',
  dataScope: undefined as number | undefined,
});

// 数据权限选项
const dataScopeOption = [
  { value: 0, label: '全部数据权限' },
  { value: 1, label: '组织及子部门数据' },
  { value: 2, label: '本部门数据权限' },
  { value: 3, label: '本人数据' },
];

// 表单校验规则
const rules = {
  dataScope: {
    required: true,
    message: '请选择数据权限',
    trigger: ['change', 'blur']
  },
};

/**
 * 打开数据权限弹窗（暴露给 ref）
 * @param roleId 角色ID
 * @param roleName 角色名称
 * @param roleCode 角色编码
 */
async function open(roleId: string, roleName: string, roleCode: string) {
  visible.value = true;
  title.value = `${roleName} - 数据权限`;
  if (roleId) {
    formData.roleId = roleId;
    formData.roleName = roleName;
    formData.roleCode = roleCode;
    await getRoleFormData(roleId);
  }
}

/**
 * 关闭数据权限弹窗（暴露给 ref）
 */
function close() {
  visible.value = false;
  roleFormRef.value?.resetFields();
  roleFormRef.value?.clearValidate();
  formData.roleId = '';
}

/**
 * 获取角色数据
 * @param roleId 角色ID
 */
async function getRoleFormData(roleId: string) {
  const data = await roleDetailApi(roleId);
  formData.dataScope = data.dataScope;
}

/**
 * 数据权限保存提交
 */
const handleSubmit = async (formEl: any | undefined) => {
  if (!formEl) return;

  try {
    await formEl.validate();
    // 构造符合RoleForm接口的数据对象
    const updateData: Partial<RoleForm> & { roleId: string } = {
      roleId: formData.roleId,
      dataScope: formData.dataScope
    };
    
    await updateRoleDataScopeApi(updateData.roleId, updateData.dataScope as number);
    message.success('数据权限设置成功');
    
    // 数据权限变更时，只重新获取用户信息
    try {
      await authStore.fetchUserInfo();
    } catch (error) {
      console.error('重新获取用户信息失败:', error);
    }
    
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
  <NModal
    v-model:show="visible"
    :title="title"
    :show-icon="false"
    preset="dialog"
    style="width: 500px;"
  >
    <NForm
      ref="roleFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      style="max-width: 400px"
    >
      <NFormItem label="角色名称">
        <NInput v-model:value="formData.roleName" :disabled="true" />
      </NFormItem>
      
      <NFormItem label="角色编码">
        <NInput v-model:value="formData.roleCode" :disabled="true" />
      </NFormItem>

      <NFormItem label="数据权限" path="dataScope">
        <NSelect v-model:value="formData.dataScope" :options="dataScopeOption" style="width: 100%" />
      </NFormItem>
    </NForm>

    <!-- 底部按钮 -->
    <template #action>
      <div class="dialog-footer">
        <NButton @click="close">取消</NButton>
        <NButton type="primary" @click="handleSubmit(roleFormRef)">
          确定
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
</style>
