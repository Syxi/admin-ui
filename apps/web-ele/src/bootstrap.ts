import { createApp, watchEffect } from 'vue';
import VueEcharts from 'vue-echarts';

import { registerAccessDirective } from '@vben/access';
import { initTippy } from '@vben/common-ui';
import { MotionPlugin } from '@vben/plugins/motion';
import { preferences } from '@vben/preferences';
import { initStores, useAccessStore } from '@vben/stores';
import '@vben/styles';
import '@vben/styles/ele';

import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import mdi from '@iconify-json/mdi/icons.json';
import { addCollection } from '@iconify/vue';
import VueVideoPlayer from '@videojs-player/vue';
import { useTitle } from '@vueuse/core';
import ElementPlus, { ElLoading } from 'element-plus';
import { watch } from 'vue';

import { registerComponents } from '#/components';
import { $t, setupI18n } from '#/locales';

import { initComponentAdapter } from './adapter/component';
import App from './app.vue';
import { router } from './router';

// 导入WebSocket服务
import webSocketService from '#/services/websocket-service';

import 'echarts';

import 'video.js/dist/video-js.css';
import 'element-plus/dist/index.css';

async function bootstrap(namespace: string) {
  // 初始化组件适配器
  await initComponentAdapter();
  // // 设置弹窗的默认配置
  // setDefaultModalProps({
  //   fullscreenButton: false,
  // });
  // // 设置抽屉的默认配置
  // setDefaultDrawerProps({
  //   zIndex: 2000,
  // });
  const app = createApp(App);

  // 注册Element Plus提供的v-loading指令
  app.directive('loading', ElLoading.directive);

  // 国际化 i18n 配置
  await setupI18n(app);

  // 配置 pinia-tore
  await initStores(app, { namespace });

  // 安装权限指令
  registerAccessDirective(app);

  // 初始化 tippy
  initTippy(app);

  // 配置路由及路由守卫
  app.use(router);

  // 配置Motion插件
  app.use(MotionPlugin);

  // 全局引入elementPlus
  app.use(ElementPlus);

  // 全局注册 v-echarts组件
  app.component('vue-echarts', VueEcharts);

  /**
   * 1注册vue的iconify: pnpm install --save-dev @iconify/vue
   * 2按需导入icon插件: pnpm i -D unplugin-icons
   * 3添加Material Design Icons本地图标，离线可以使用: pnpm add -D @iconify-json/mdi
   *
   */
  addCollection(mdi);

  // 注册vueVideoPlayer
  app.use(VueVideoPlayer);

  // 注册所有elementPlus图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }

  // 全局注册自定义组件
  registerComponents(app);

  // 动态更新标题
  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      const pageTitle =
        (routeTitle ? `${$t(routeTitle)} - ` : '') + preferences.app.name;
      useTitle(pageTitle);
    }
  });

  // 在应用挂载后初始化WebSocket监听
  app.mount('#app');
  
  // 初始化WebSocket服务
  initWebSocketListener();
}

/**
 * 初始化WebSocket监听
 * 在Pinia可用后初始化WebSocket监听逻辑
 */
function initWebSocketListener() {
  const accessStore = useAccessStore();
  
  // 监听accessToken变化
  watch(
    () => accessStore.accessToken,
    (newToken, oldToken) => {
      if (newToken && !oldToken) {
        // 用户登录，连接WebSocket
        console.log('User logged in, connecting WebSocket...');
        webSocketService.connect();
      } else if (!newToken && oldToken) {
        // 用户登出，断开WebSocket
        console.log('User logged out, disconnecting WebSocket...');
        webSocketService.disconnect();
      } else if (newToken && oldToken && newToken !== oldToken) {
        // Token更新，重新连接WebSocket
        console.log('Token updated, reconnecting WebSocket...');
        webSocketService.disconnect();
        setTimeout(() => {
          webSocketService.connect();
        }, 100);
      }
    },
    { immediate: true }
  );
  
  // 设置权限更新的默认处理逻辑
  webSocketService.setPermissionUpdateCallback((data) => {
    console.log('Permission update received:', data);
    // 这里可以添加全局的权限更新处理逻辑
  });
  
  // 设置进度消息的默认处理逻辑
  webSocketService.setProgressCallback((data) => {
    console.log('Progress message received:', data);
    // 这里可以添加全局的进度处理逻辑
  });
  
  // 设置公共消息的默认处理逻辑
  webSocketService.setMessageCallback((data) => {
    console.log('Public message received:', data);
    // 这里可以添加全局的公共消息处理逻辑
  });
}

export { bootstrap };