<script setup lang="ts">
import type { NoteForm } from '#/api/system/note/note';

import { reactive, ref } from 'vue';

import { ElForm, ElMessage } from 'element-plus';

import {
  addNoteApi,
  editNoteApi,
  getNoteDetailApi,
} from '#/api/system/note/note';
import { WangEditor } from '#/components/wang-editor';

const emit = defineEmits<{ (e: 'success'): void }>();

// 笔记表单
const noteFormRef = ref(ElForm);

// 加载状态
const loading = ref(false);

// 笔记表单数据
const formData = reactive<NoteForm>({
  title: '',
  content: '',
  status: 1,
});

// 弹窗对象
const dialog = reactive({
  visible: false,
  width: 900,
  title: '',
});

// 校验规则
const rules = reactive({
  title: [{ required: true, message: '笔记标题不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '笔记内容不能为空', trigger: 'blur' }],
});

function resetForm() {
  noteFormRef.value.resetFields();
  noteFormRef.value.clearValidate();
  formData.noteId = undefined;
  formData.title = '';
  formData.content = '';
  formData.status = 1;
}

// 新增或编辑笔记弹出窗口事件
async function openDialog(noteId?: string) {
  dialog.visible = true;
  if (noteId) {
    dialog.title = '修改笔记';
    const data = await getNoteDetailApi(noteId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增笔记';
  }
}

// 关闭弹窗
function closeDialog() {
  dialog.visible = false;
  resetForm();
}

// 提交表单
const handleSubmit = async () => {
  // 验证表单字段
  const valid = noteFormRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    const noteId = formData.noteId;
    await (noteId ? editNoteApi(formData) : addNoteApi(formData));
    ElMessage.success(noteId ? '修改笔记成功!' : '新增笔记成功！');
    emit('success');
    closeDialog();
  } finally {
    loading.value = false;
  }
};

defineExpose({ openDialog });
</script>
<template>
  <el-dialog
    v-model="dialog.visible"
    :title="dialog.title"
    :width="dialog.width"
    :close-on-click-modal="false"
    :open-delay="60"
    draggable
    center
    @close="closeDialog()"
  >
    <ElForm
      :model="formData"
      :rules="rules"
      ref="noteFormRef"
      label-width="100px"
    >
      <el-form-item label="笔记标题：" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入笔记标题"
        />
      </el-form-item>

      <el-form-item label="笔记内容：" prop="content">
        <WangEditor v-model="formData.content" />
      </el-form-item>

      <el-form-item label="状态：">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">正常</el-radio>
          <el-radio :value="-1">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog()">取消</el-button>
        <el-button type="primary" @click="handleSubmit()">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.editor-wrapper {
  margin-top: 10px;
}
</style>
