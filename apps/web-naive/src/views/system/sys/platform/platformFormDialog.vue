<script setup lang="ts">
import type { Platform } from '#/api/system/sys/platform';

import { reactive, ref } from 'vue';

import { NModal, NForm, NFormItem, NInput, NRadioGroup, NRadio, NInputNumber, NButton } from 'naive-ui';
import { message } from '#/hooks';

import {
  addPlatformApi,
  getPlatformInfoApi,
  updatePlatformApi,
} from '#/api/system/sys/platform';
import {MenuTypeEnum} from "#/enums/MenuTypesEnum";
import {IconPicker} from "@vben/common-ui";

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 本地状态
const visible = ref(false);

const title = ref('');

const platformFormRef = ref();

const formData = reactive<Platform>({
  id: '',
  name: '',
  icon: '',
  status: undefined,
  sort: undefined,
});

// 表单校验规则
const rules = {
  name: [{ required: true, message: '请输入平台名称', trigger: ['input'] }],
  status: [{ required: true, message: '请选择状态', trigger: ['blur'] }],
};

/**
 * 打开平台表单弹窗（暴露给 ref）
 * @param id 平台ID
 */
async function open(id?: string) {
  visible.value = true;
  title.value = id ? '修改平台' : '新增平台';
  if (id) {
    await getPlatformData(id);
  }
}

/**
 * 关闭平台表单弹窗（暴露给 ref）
 */
function close() {
  visible.value = false;
  platformFormRef.value?.restoreValidation();
  formData.id = '';
}

/**
 * 获取平台数据
 * @param id 平台ID
 */
async function getPlatformData(id: string) {
  const data = await getPlatformInfoApi(id);
  Object.assign(formData, data);
}

/**
 * 平台保存提交
 */
const handleSubmit = async () => {
  try {
    await platformFormRef.value?.validate();
    const id = formData.id;
    await (id ? updatePlatformApi(formData) : addPlatformApi(formData));
    message.success(id ? '修改平台成功' : '新增平台成功');
    close();
    emit('success'); // 通知父组件刷新列表
  } catch (error) {
    // 验证失败或其他错误
  }
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
    :z-index="100"
  >
    <NForm
      ref="platformFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <NFormItem label="平台名称" path="name" :show-require-mark="true">
        <NInput v-model:value="formData.name" placeholder="请输入平台名称" />
      </NFormItem>

      <NFormItem label="平台路径" path="path">
        <NInput v-model:value="formData.path" placeholder="请输入平台名称" />
      </NFormItem>

      <NFormItem label="平台icon" path="icon">
        <IconPicker v-model="formData.icon" />
      </NFormItem>

      <NFormItem label="状态" path="status" :show-require-mark="true">
        <NRadioGroup v-model:value="formData.status">
          <NRadio :value="1">启用</NRadio>
          <NRadio :value="-1">禁用</NRadio>
        </NRadioGroup>
      </NFormItem>

      <NFormItem label="排序" path="sort">
        <NInputNumber v-model:value="formData.sort" :min="0" />
      </NFormItem>

      <NFormItem label="备注" path="remake">
        <NInput type="textarea" v-model:value="formData.remake" :rows="4" />
      </NFormItem>
    </NForm>

    <!-- 底部按钮 -->
    <template #action>
      <div class="dialog-footer">
        <NButton @click="close">取消</NButton>
        <NButton type="primary" @click="handleSubmit">
          确定
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped></style>