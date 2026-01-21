<script setup lang="ts">
import {WangEditor} from "#/components/wang-editor";
import {ElForm, ElMessage} from "element-plus";
import {reactive, ref} from "vue";
import {
  addNoticeApi,
  getNoticeApi,
  type NoticeForm,
  updateNoticeApi
} from "#/api/system/sys/notice";

const emit = defineEmits<{ (e: 'success'):void }>();

const noticeFormRef = ref(ElForm);

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
  ElMessage.success(noticeId ? '修改成功' : '新增成功');
  emit('success');
  closeDialog();
}

defineExpose({ openDialog });
</script>
<template>
  <el-drawer
    v-model="dialog.visible"
    :title="dialog.title"
    @close="closeDialog"
    size="50%"
  >
    <ElForm
      ref="noticeFormRef"
      :model="formData"
      :rules="rules"
    >
      <el-form-item label="标题：" prop="noticeTitle">
        <el-input
          v-model="formData.noticeTitle"
          placeholder="请输入通知标题"
        />
      </el-form-item>

      <el-form-item label="发布：" prop="isPublish">
        <el-radio-group v-model="formData.isPublish">
          <el-radio :value="1">发布</el-radio>
          <el-radio :value="-1">未发布</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="置顶：" prop="isTop">
        <el-radio-group v-model="formData.isTop">
          <el-radio :value="1">置顶</el-radio>
          <el-radio :value="-1">取消置顶</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="通知内容：">
        <WangEditor v-model:model-value="formData.noticeContent" />
      </el-form-item>
    </ElForm>
    <template #footer>
      <div >
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-drawer>
</template>
