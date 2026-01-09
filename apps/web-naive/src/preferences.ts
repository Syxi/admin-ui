import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: import.meta.env.VITE_APP_TITLE,
    accessMode: 'backend', // 后端动态生成路由
  },
  widget: {
    notification: false, // 关闭头部的通知组件
  },
  logo: {
    enable: true,
    source: '/static/img/codesee-icon.svg',
  },
  copyright: {
    companyName: '未来科技',
    companySiteLink: 'https://www.vben.pro',
    date: '2025',
    enable: false,
    icp: '',
    icpLink: '',
    settingShow: false,
  },
  tabbar: {
    keepAlive: false, // 关闭标签页缓存
    persist: false, // 关闭持久化标签
  },
});
