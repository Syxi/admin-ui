<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef } from 'vue';

// API 引用
import { useVModel } from '@vueuse/core';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';

import { uploadImageApi } from '#/api/system/media/image';

import '@wangeditor/editor/dist/css/style.css';

const props = defineProps({
  modelValue: {
    type: [String],
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const modelValue = useVModel(props, 'modelValue', emit);

const editorRef = shallowRef(); // 编辑器实例，必须用 shallowRef
const mode = ref('default'); // 编辑器模式
const toolbarConfig = ref({}); // 工具条配置

const path = `${import.meta.env.VITE_GLOB_API_URL}`;

// 编辑器配置
const editorConfig = ref({
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      // 自定义图片上传
      async customUpload(file: any, insertFn: any) {
        uploadImageApi(file).then((data) => {
          console.log('上传图片返回数据：', data);

          insertFn(path + data);
        });
      },
    },
  },
});

const handleCreated = (editor: any) => {
  editorRef.value = editor; // 记录 editor 实例，重要！
};

function handleChange(editor: any) {
  modelValue.value = editor.getHtml();
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor === null) return;
  editor.destroy();
});
</script>

<template>
  <div class="editor-wrapper">
    <!-- 工具栏 -->
    <Toolbar
      id="toolbar-container"
      :editor="editorRef"
      :default-config="toolbarConfig"
      :mode="mode"
    />
    <!-- 编辑器 -->
    <Editor
      style="height: 300px; overflow-y: hidden"
      id="editor-container"
      v-model="modelValue"
      :default-config="editorConfig"
      :mode="mode"
      @on-change="handleChange"
      @on-created="handleCreated"
    />
  </div>
</template>
