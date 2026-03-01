import type { RouteRecordStringComponent } from '@vben/types';

const workflowRoutes: RouteRecordStringComponent[] = [
  {
    component: '/layouts/basic.vue',
    name: 'Workflow',
    path: '/workflow',
    meta: {
      title: '工作流管理',
      icon: 'FlowChartOutlined',
      order: 9
    },
    children: [
      {
        component: '/workflow/definition/index.vue',
        name: 'WorkflowDefinition',
        path: 'definition',
        meta: {
          title: '流程定义',
          icon: 'FileTextOutlined',
          order: 1
        }
      },
      {
        component: '/workflow/instance/index.vue',
        name: 'WorkflowInstance',
        path: 'instance',
        meta: {
          title: '流程实例',
          icon: 'DatabaseOutlined',
          order: 2
        }
      },
      {
        component: '/workflow/task/todo.vue',
        name: 'WorkflowTodo',
        path: 'todo',
        meta: {
          title: '待办任务',
          icon: 'InboxOutlined',
          order: 3
        }
      },
      {
        component: '/workflow/task/done.vue',
        name: 'WorkflowDone',
        path: 'done',
        meta: {
          title: '已办任务',
          icon: 'CheckCircleOutlined',
          order: 4
        }
      },
      {
        component: '/workflow/form/index.vue',
        name: 'WorkflowForm',
        path: 'form',
        meta: {
          title: '表单管理',
          icon: 'FormOutlined',
          order: 5
        }
      },
      {
        component: '/workflow/carbon-copy/index.vue',
        name: 'WorkflowCarbonCopy',
        path: 'carbon-copy',
        meta: {
          title: '流程抄送',
          icon: 'MailOutlined',
          order: 6
        }
      },
      {
        component: '/workflow/statistics/index.vue',
        name: 'WorkflowStatistics',
        path: 'statistics',
        meta: {
          title: '工作流统计',
          icon: 'BarChartOutlined',
          order: 7
        }
      }
    ]
  }
];

export default workflowRoutes;
