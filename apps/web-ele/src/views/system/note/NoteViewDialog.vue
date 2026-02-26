<script setup lang="ts">
import type { NoteForm } from '#/api/system/note/note';

import { reactive, ref } from 'vue';

import { ElMessage } from 'element-plus';

import {
  getNoteDetailApi,
} from '#/api/system/note/note';

const emit = defineEmits<{ (e: 'success'): void }>();

// 加载状态
const loading = ref(false);

// 笔记详情数据
const noteDetail = reactive<NoteForm>({
  title: '',
  content: '',
  status: 1,
});

// 弹窗对象
const dialog = reactive({
  visible: false,
  width: 900,
  title: '查看笔记',
});

// 滚动容器引用
const scrollbarRef = ref();

// 打开查看弹窗
async function openDialog(noteId: string) {
  dialog.visible = true;
  loading.value = true;
  try {
    const data = await getNoteDetailApi(noteId);
    Object.assign(noteDetail, data);
  } finally {
    loading.value = false;
  }
}

// 关闭弹窗
function closeDialog() {
  dialog.visible = false;
  noteDetail.noteId = undefined;
  noteDetail.title = '';
  noteDetail.content = '';
  noteDetail.status = 1;
}

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
    <div v-loading="loading" class="note-view-container">
      <div class="note-title">
        <h3>{{ noteDetail.title }}</h3>
        <el-tag :type="noteDetail.status === 1 ? 'success' : 'info'" class="ml-2">
          {{ noteDetail.status === 1 ? '正常' : '禁用' }}
        </el-tag>
      </div>
      
      <el-scrollbar
        ref="scrollbarRef"
        max-height="500px"
        class="note-content-scroll"
      >
        <div class="note-content" v-html="noteDetail.content"></div>
      </el-scrollbar>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog()">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.note-view-container {
  width: 100%;
  padding: 20px 0;
  position: relative;
}

.note-title {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid hsl(var(--border));
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--primary));
  }
}

.note-content-scroll {
  margin-top: 20px;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

.note-content {
  padding: 20px;
  background-color: hsl(var(--background));
  line-height: 1.6;
  
  :deep() {
    img {
      max-width: 100%;
      height: auto;
    }
    
    pre {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'Courier New', Courier, monospace;
    }
    
    code {
      font-family: 'Courier New', Courier, monospace;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
