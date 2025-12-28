<script setup lang="ts">
import type { DictTypeForm } from '#/api/system/sys/dictType';

import { reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NRadioGroup, NRadio, NInputNumber, NButton, useMessage, NModal } from 'naive-ui';

import { h } from 'vue';

const message = useMessage();

import {
  addDictTypeApi,
  editDictTypeApi,
  getDictTypeDetailApi,
} from '#/api/system/sys/dictType';

const emit = defineEmits<{ (e: 'success'): void }>();

const dataFormRef = ref();

const loading = ref(false);

const formData = reactive<DictTypeForm>({
  status: 1,
});

const dialog = reactive({
  title: '',
  visible: false,
});

const rules = reactive({
  name: [{ required: true, message: '请输入字典类型名称', trigger: 'blur' }],
  typeCode: [
    { required: true, message: '请输入字典类型编码', trigger: 'blur' },
  ],
});

/**
 * 打开字典类型表单弹窗
 * @param dictTypeId
 */
async function openDialog(dictTypeId?: string) {
  dialog.visible = true;
  if (dictTypeId) {
    dialog.title = '修改字典类型';
    const data = await getDictTypeDetailApi(dictTypeId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增字典类型';
  }
}

/**
 * 关闭弹窗
 */
function closeDialog() {
  dialog.visible = false;
  resetForm();
}

/**
 * 重置表单
 */
function resetForm() {
  dataFormRef.value.resetFields();
  dataFormRef.value.clearValidate();

  formData.id = undefined;
  formData.status = 1;
}

/**
 * 提交表单
 */
async function handleSubmit() {
  const valid = dataFormRef.value.validate();
  if (!valid) return;

  loading.value = true;
  const dictTypeId = formData.id;
  await (dictTypeId ? editDictTypeApi(formData) : addDictTypeApi(formData));
  message.success(dictTypeId ? '修改成功' : '新增成功');
  emit('success');
  loading.value = false;
  closeDialog();
}

defineExpose({ openDialog });
</script>

<template>
  <NModal
    v-model:show="dialog.visible"
    :title="dialog.title"
    :show-icon="false"
    preset="dialog"
    style="width: 500px;"
    @close="closeDialog()"
  >
    <NForm
      ref="dataFormRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      style="max-width: 400px"
    >
      <NFormItem label="字典类型名称" path="name">
        <NInput v-model:value="formData.name" placeholder="请输入字典类型名称" />
      </NFormItem>

      <NFormItem label="字典类型编码" path="typeCode">
        <NInput
          v-model:value="formData.typeCode"
          placeholder="请输入字典类型编码"
        />
      </NFormItem>

      <NFormItem label="状态" path="status">
        <NRadioGroup v-model:value="formData.status">
          <NRadio :value="1">正常</NRadio>
          <NRadio :value="-1">停用</NRadio>
        </NRadioGroup>
      </NFormItem>

      <NFormItem label="排序" path="sort">
        <NInputNumber v-model:value="formData.sort" :min="0" />
      </NFormItem>

      <NFormItem label="备注" path="remark">
        <NInput
          v-model:value="formData.remark"
          type="textarea"
          placeholder="字典类型备注"
          :autosize="{ minRows: 2, maxRows: 6 }"
        />
      </NFormItem>
    </NForm>
    <template #action>
      <div class="dialog-footer">
        <NButton @click="closeDialog()">取消</NButton>
        <NButton type="primary" @click="handleSubmit()">确定</NButton>
      </div>
    </template>
  </NModal>
</template>
