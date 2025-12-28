<script setup lang="ts">
import type { FormRules } from 'naive-ui';

import type { TenantForm } from '#/api/system/sys/tenant';

import { defineEmits, defineExpose, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NRadioGroup, NRadio, NInputNumber, NButton, useMessage, NModal } from 'naive-ui';

import { h } from 'vue';

import { addTenantApi, editTenantApi, tenantDetailApi } from '#/api/system/sys/tenant';

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 本地状态
const visible = ref(false);

const title = ref('');

const tenantFormRef = ref();

const formData = reactive<TenantForm>({
  id: '',
  code: '',
  name: '',
  status: undefined,
  sort: undefined,
});


// 表单校验规则
const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入租户名称', trigger: ['input', 'blur'] }],
  code: [{ required: true, message: '请输入租户编码', trigger: ['input', 'blur'] }],
  status: [{ required: true, message: '请选择状态', trigger: ['change'] }],
});

// 消息提示
const message = useMessage();

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
const handleSubmit = async (formEl: any | undefined) => {
  if (!formEl) return;

  await formEl.validate(async (valid: boolean) => {
    if (valid) {
      const id = formData.id;
      await (id ? editTenantApi(formData) : addTenantApi(formData));
      message.success(id ? '修改租户成功' : '新增租户成功');
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
  <NModal
    v-model:show="visible"
    :title="title"
    :show-icon="false"
    preset="dialog"
    style="width: 500px;"
    @close="close"
  >
    <NForm
      ref="tenantFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      style="max-width: 400px"
    >
      <NFormItem label="租户名称" path="name">
        <NInput v-model:value="formData.name" placeholder="请输入租户名称" />
      </NFormItem>

      <NFormItem label="租户编码" path="code">
        <NInput v-model:value="formData.code" placeholder="请输入租户编码" />
      </NFormItem>

      <NFormItem label="状态" path="status">
        <NRadioGroup v-model:value="formData.status">
          <NRadio :value="1">启用</NRadio>
          <NRadio :value="-1">禁用</NRadio>
        </NRadioGroup>
      </NFormItem>

      <NFormItem label="排序" path="sort">
        <NInputNumber v-model:value="formData.sort" :min="0" />
      </NFormItem>
    </NForm>

    <!-- 底部按钮 -->
    <template #action>
      <div class="dialog-footer">
        <NButton @click="close">取消</NButton>
        <NButton type="primary" @click="handleSubmit(tenantFormRef)">
          确定
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
</style>
