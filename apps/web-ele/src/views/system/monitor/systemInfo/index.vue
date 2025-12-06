<script setup lang="ts">
import type { SystemInfoVO } from '#/api/system/sys/systemInfo';

import { onMounted, ref } from 'vue';

import { getSystemInfo } from '#/api/system/sys/systemInfo';

const systemInfo = ref<SystemInfoVO>();

onMounted(async () => {
  systemInfo.value = await getSystemInfo();
});

// 重定向到图表视图页面
import ChartView from './chart-view.vue';
</script>

<template>
  <ChartView />
</template>

<style scoped>
</style>
