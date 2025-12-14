<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';

import type { RoleForm } from '#/api/system/sys/role';

import { defineEmits, reactive, ref } from 'vue';

import { ElForm, ElMessage } from 'element-plus';

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

const roleFormRef = ref<FormInstance>();

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
const rules = reactive<FormRules<typeof formData>>({
  dataScope: [{ required: true, message: '请选择数据权限', trigger: 'blur' }],
});

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
const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  await formEl.validate(async (valid) => {
    if (valid) {
      // 构造符合RoleForm接口的数据对象
      const updateData: Partial<RoleForm> & { roleId: string } = {
        roleId: formData.roleId,
        dataScope: formData.dataScope
      };
      
      await updateRoleDataScopeApi(updateData.roleId, updateData.dataScope as number);
      ElMessage.success('数据权限设置成功');
      
      // 数据权限变更时，只重新获取用户信息
      try {
        await authStore.fetchUserInfo();
      } catch (error) {
        console.error('重新获取用户信息失败:', error);
      }
      
      close();
      emit('success'); // 通知父组件刷新列表
    }
  });
};

// 暴露方法给 ref
defineExpose({ open, close });
</script>

<template>
  <el-dialog
    draggable
    center
    v-model="visible"
    :title="title"
    width="500px"
  >
    <ElForm
      ref="roleFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      class="pr-5"
    >
      <el-form-item label="角色名称">
        <el-input v-model="formData.roleName" disabled />
      </el-form-item>
      
      <el-form-item label="角色编码">
        <el-input v-model="formData.roleCode" disabled />
      </el-form-item>

      <el-form-item label="数据权限" prop="dataScope">
        <el-select v-model="formData.dataScope" style="width: 100%">
          <el-option
            v-for="item in dataScopeOption"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
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
