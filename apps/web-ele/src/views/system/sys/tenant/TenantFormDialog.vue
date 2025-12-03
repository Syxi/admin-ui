<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';

import type { TenantForm } from '#/api/system/sys/tenant';

import { defineEmits, defineExpose, reactive, ref } from 'vue';

import { ElForm, ElMessage } from 'element-plus';

import { addTenantApi, editTenantApi, tenantDetailApi } from '#/api/system/sys/tenant';

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 本地状态
const visible = ref(false);

const title = ref('');

const tenantFormRef = ref<FormInstance>();

const formData = reactive<TenantForm>({
  id: '',
  code: '',
  name: '',
  status: undefined,
  sort: undefined,
});


// 表单校验规则
const rules = reactive<FormRules<TenantForm>>({
  name: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入租户编码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'blur' }],
});

/**
 * 打开租户表单弹窗（暴露给 ref）
 * @param id 租户ID
 */
async function open(id?: string) {
  visible.value = true;
  title.value = id ? '修改租户' : '新增租户';
  if (id) {
    await getTenantFormData(id);
  }
}

/**
 * 关闭租户表单弹窗（暴露给 ref）
 */
function close() {
  visible.value = false;
  tenantFormRef.value?.resetFields();
  tenantFormRef.value?.clearValidate();
  formData.id = '';
}

/**
 * 获取租户数据
 * @param id 租户ID
 */
async function getTenantFormData(id: string) {
  const data = await tenantDetailApi(id);
  Object.assign(formData, data);
}

/**
 * 租户保存提交
 */
const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  await formEl.validate(async (valid) => {
    if (valid) {
      const id = formData.id;
      await (id ? editTenantApi(formData) : addTenantApi(formData));
      ElMessage.success(id ? '修改租户成功' : '新增租户成功');
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
      ref="tenantFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="租户名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入租户名称" />
      </el-form-item>

      <el-form-item label="租户编码" prop="code">
        <el-input v-model="formData.code" placeholder="请输入租户编码" />
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
        <el-button type="primary" @click="handleSubmit(tenantFormRef)">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
</style>
