<script setup lang="ts">
import type { FileRecordVO } from '#/api/system/media/file';

import { reactive, ref } from 'vue';

import { NModal } from 'naive-ui';
import { message } from '#/hooks';

const emit = defineEmits<{ (e: 'success'): void }>();

const dialog = reactive({
  title: '',
  visible: false,
});

const pdfUrl = ref('');

function closeDialog() {
  dialog.visible = false;
  pdfUrl.value = '';
}

async function handlePreviewFile(row: FileRecordVO) {
  try {
    // 文件已转换成功，打开预览对话框
    dialog.visible = true;
    dialog.title = row.fileName;

    const url = `${import.meta.env.VITE_GLOB_API_URL}${row.url}${row.fileMd5}.pdf`;
    pdfUrl.value = `/static/pdfjs/web/viewer.html?file=${encodeURIComponent(url)}`;
    emit('success');
  } catch {
    message.error('不支持该格式文件转换成pdf');
  }
}

defineExpose({ handlePreviewFile });
</script>
<template>
  <NModal
    v-model:show="dialog.visible"
    :title="dialog.title"
    :show-icon="false"
    preset="dialog"
    style="width: 100%; height: 100%;"
    @close="closeDialog()"
  >
    <div style="height: 90vh; overflow: hidden">
      <iframe
        :src="pdfUrl"
        style="width: 100%; height: 100%"
        allowfullscreen
      ></iframe>
    </div>
  </NModal>
</template>