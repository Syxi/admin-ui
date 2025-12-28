<script setup lang="ts">
import {WangEditor} from "#/components/wang-editor";
import {NForm, NFormItem, NInput, NRadioGroup, NRadio, NButton, NDrawer, useMessage} from "naive-ui";
import {reactive, ref} from "vue";
import {
  addNoticeApi,
  getNoticeApi,
  type NoticeForm,
  updateNoticeApi
} from "#/api/system/sys/notice";

const message = useMessage();

const emit = defineEmits<{ (e: 'success'):void }>();

const noticeFormRef = ref();

const dialog = reactive({
  title: '',
  visible: false,
});

const formData = reactive<NoticeForm>({
  isPublish: -1,
  isTop: -1,
  noticeContent: '',
});

const rules = reactive({
  noticeTitle: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  isPublish: [{ required: true, message: '请选择是否发布', trigger: 'blur' }],
  isTop: [{ required: true, message: '请选择是否置顶', trigger: 'blur' }],
});

/**
 * 关闭表单弹窗
 */
function closeDialog() {
  dialog.visible = false;
  resetForm();
}

/**
 * 重置表单
 */
function resetForm() {
  noticeFormRef.value.resetFields();
  noticeFormRef.value.clearValidate();

  formData.noticeId = undefined;
  formData.noticeContent = '';
}

/**
 * 打开表单弹窗
 * @param noticeId
 */
async function openDialog(noticeId?: string) {
  dialog.visible = true;
  if (noticeId) {
    dialog.title = '修改通知';
    const data = await getNoticeApi(noticeId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增通知';
  }
}

/**
 * 保存提交
 */
async function handleSubmit() {
  const valid = noticeFormRef.value.validate();
  if (!valid) return;

  const noticeId = formData.noticeId;
  await (noticeId ? updateNoticeApi(formData) : addNoticeApi(formData));
  message.success(noticeId ? '修改成功' : '新增成功');
  emit('success');
  closeDialog();
}

defineExpose({ openDialog });
</script>
<template>
  <NDrawer
    v-model:show="dialog.visible"
    @close="closeDialog"
    :width="500"
  >
    <template #header>
      <div class="flex justify-center">
      <h1>{{ dialog.title }}</h1>
      </div>
    </template>
    <NForm
      ref="noticeFormRef"
      :model="formData"
      :rules="rules"
      :label-width="80"
    >
      <NFormItem path="noticeTitle" label="标题：">
        <NInput
          v-model:value="formData.noticeTitle"
          placeholder="请输入通知标题"
        />
      </NFormItem>

      <NFormItem path="isPublish" label="发布：">
        <NRadioGroup v-model:value="formData.isPublish">
          <NRadio :value="1">发布</NRadio>
          <NRadio :value="-1">未发布</NRadio>
        </NRadioGroup>
      </NFormItem>

      <NFormItem path="isTop" label="置顶：">
        <NRadioGroup v-model:value="formData.isTop">
          <NRadio :value="1">置顶</NRadio>
          <NRadio :value="-1">取消置顶</NRadio>
        </NRadioGroup>
      </NFormItem>

      <NFormItem label="通知内容：">
        <WangEditor v-model:model-value="formData.noticeContent" />
      </NFormItem>
    </NForm>
    <template #footer>
      <div class="flex justify-center">
        <NButton @click="closeDialog">取消</NButton>
        <NButton type="primary" @click="handleSubmit">确定</NButton>
      </div>
    </template>
  </NDrawer>
</template>
