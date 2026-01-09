<script setup lang="ts">
import type { FormRules } from 'naive-ui';

import type { TenantForm } from '#/api/system/sys/tenant';

import { defineEmits, defineExpose, reactive, ref } from 'vue';

import { 
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadioGroup,
  NRadio,
  NButton,
  useMessage
} from 'naive-ui';

import { addTenantApi, editTenantApi, tenantDetailApi } from '#/api/system/sys/tenant';

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 本地状态
const visible = ref(false);

const title = ref('');

const tenantFormRef = ref();
const message = useMessage();

const formData = reactive<TenantForm>({
  id: '',
  code: '',
  name: '',
  status: undefined,
  sort: undefined,
});


// 表单校验规则
const rules = {
  name: {
    required: true,
    message: '请输入租户名称',
    trigger: ['input', 'blur']
  },
  code: {
    required: true,
    message: '请输入租户编码',
    trigger: ['input', 'blur']
  },
  status: {
    required: true,
    message: '请选择状态',
    trigger: ['blur', 'change']
  },
};

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
  // Naive UI 的表单重置方法可能不同，这里我们手动重置表单数据
  Object.assign(formData, {
    id: '',
    code: '',
    name: '',
    status: undefined,
    sort: undefined,
  });
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

  try {
    await formEl.validate();
    const id = formData.id;
    await (id ? editTenantApi(formData) : addTenantApi(formData));
    message.success(id ? '修改租户成功' : '新增租户成功');
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
  <n-modal v-model:show="visible" :title="title" preset="card" style="width: 500px; max-width: 90vw;">
    <n-form
      ref="tenantFormRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="100px"
    >

      <n-form-item label="租户名称" path="name">
        <n-input v-model:value="formData.name" placeholder="请输入租户名称" />
      </n-form-item>

      <n-form-item label="租户编码" path="code">
        <n-input v-model:value="formData.code" placeholder="请输入租户编码" />
      </n-form-item>

      <n-form-item label="状态" path="status">
        <n-radio-group v-model:value="formData.status">
          <n-radio :value="1" size="medium">启用</n-radio>
          <n-radio :value="-1" size="medium">禁用</n-radio>
        </n-radio-group>
      </n-form-item>

      <n-form-item label="排序" path="sort">
        <n-input-number v-model:value="formData.sort" :min="0" />
      </n-form-item>
    </n-form>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <n-space justify="end">
          <n-button @click="close">取消</n-button>
          <n-button type="primary" @click="handleSubmit(tenantFormRef)">
            确定
          </n-button>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>

<style scoped>
</style>
