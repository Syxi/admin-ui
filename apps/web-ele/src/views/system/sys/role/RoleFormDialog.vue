<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';

import type { RoleForm } from '#/api/system/sys/role';

import { defineEmits, defineExpose, reactive, ref } from 'vue';

import { ElForm, ElMessage } from 'element-plus';

import { addRoleApi, editRoleApi, roleDetailApi } from '#/api/system/sys/role';

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 本地状态
const visible = ref(false);

const title = ref('');

const roleFormRef = ref<FormInstance>();

const formData = reactive<RoleForm>({
  roleId: '',
  roleCode: '',
  roleName: '',
  status: undefined,
  sort: undefined,
});

// 表单校验规则
const rules = reactive<FormRules<RoleForm>>({
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'blur' }],
});

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
  Object.assign(formData, data);
}

/**
 * 角色保存提交
 */
const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  await formEl.validate(async (valid) => {
    if (valid) {
      const roleId = formData.roleId;
      await (roleId ? editRoleApi(formData) : addRoleApi(formData));
      ElMessage.success(roleId ? '修改角色成功' : '新增角色成功');
      close();
      emit('success'); // 通知父组件刷新列表
    }
  });
};

// 暴露方法给 ref
defineExpose({ open, close });
</script>

<template>
  <!-- 弹窗主体 -->
  <el-dialog
    center
    draggable
    v-model="visible"
    :title="title"
    width="500px"
    @close="close"
  >
    <ElForm
      ref="roleFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model="formData.roleName" placeholder="请输入角色名称" />
      </el-form-item>

      <el-form-item label="角色编码" prop="roleCode">
        <el-input v-model="formData.roleCode" placeholder="请输入角色编码" />
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

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="handleSubmit(roleFormRef)">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
</style>
