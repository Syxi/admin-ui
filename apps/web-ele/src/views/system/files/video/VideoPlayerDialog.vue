<script setup lang="ts">
import { reactive, ref } from 'vue';

import { VideoPlayer } from '@videojs-player/vue';

const emit = defineEmits<{ (e: 'success'): void }>();

const videoPlayerRef = ref();

const dialog = reactive({
  title: '',
  visible: false,
});

// 视频播放源
const videoSrc = ref('');

// 是否静音
const muted = ref(false);

const playerOptions = ref({
  playbackRates: [0.5, 1, 1.5, 2], // 可选播放速度
  loop: false, // 是否视频一结束就重新开始
  fluid: true, // 按比例缩放以适应其容器
  controls: true, // 是否显示控件
  autoplay: true,
  poster: '', // 封面
  controlBar: {
    timeDivider: true, // 当前时间和持续时间的分隔符
    durationDisplay: true, // 显示持续时间
    remainingTimeDisplay: true, // 是否显示剩余时间功能
    fullscreenToggle: true, // 是否显示全屏按钮
  },
});

/**
 * 关闭预览弹窗
 */
function closeDialog() {
  // 获取 videojs 播放器实例
  videoSrc.value = '';
  muted.value = true;
  dialog.visible = false;
}

/**
 * 播放视频
 * @param fileName
 * @param url
 */
function handlePlayVideo(fileName: string, url: string) {
  dialog.visible = true;
  muted.value = false;
  dialog.title = fileName;

  // path: 视频文件在服务端的保存路径
  const path = url + fileName;
  // 构建url
  const videoUrl = `${import.meta.env.VITE_GLOB_API_URL}/${path}`;
  videoSrc.value = videoUrl;
  emit('success');
}

defineExpose({ handlePlayVideo });
</script>
<template>
  <el-dialog
    v-model="dialog.visible"
    :title="dialog.title"
    @close="closeDialog()"
    center
    draggable
  >
    <VideoPlayer
      ref="videoPlayerRef"
      :playsinline="false"
      :options="playerOptions"
      :src="videoSrc"
      :muted="muted"
    />
  </el-dialog>
</template>
