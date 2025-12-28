import type { RouteRecordStringComponent } from '@vben/types';

const localRoutes: RouteRecordStringComponent[] = [
  {
    component: '/dashboard/index.vue',
    meta: {
      icon: 'lucide:house',
      order: -1,
      title: '首页',
    },
    name: 'Dashboard',
    path: '/dashboard',
    // children: [
    //   {
    //     name: 'Analytics',
    //     path: '/analytics',
    //     component: '/dashboard/analytics/index.vue',
    //     meta: {
    //       affixTab: true,
    //       icon: 'lucide:area-chart',
    //       title: '首页',
    //     },
    //   },
    // {
    //   name: 'Workspace',
    //   path: '/workspace',
    //   component: '/dashboard/workspace/index.vue',
    //   meta: {
    //     icon: 'carbon:workspace',
    //     title: $t('page.dashboard.workspace'),
    //   },
    // },
    // ],
  },

  {
    component: '/system/profile/index.vue',
    name: 'Profile',
    path: '/profile',
    meta: {
      icon: 'lucide:settings',
      title: '个人中心',
      hideInMenu: true,
    },
  },

  {
    component: '/home/index.vue',
    name: 'home',
    path: '/home',
    meta: {
      icon: '',
      title: '',
      hideInMenu: true,
      noBasicLayout: true,
    },
  },
];

export default localRoutes;
