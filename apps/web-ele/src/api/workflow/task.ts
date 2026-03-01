import { requestClient as request } from '../request';

/**
 * 流程任务相关接口
 */
export const workflowTaskApi = {
  /**
   * 待办任务分页列表
   */
  getTodoPage: (params: any) => {
    return request.get('/workflow/task/todo', { params });
  },

  /**
   * 已办任务分页列表
   */
  getDonePage: (params: any) => {
    return request.get('/workflow/task/done', { params });
  },

  /**
   * 任务详情
   */
  getTaskById: (id: number) => {
    return request.get(`/workflow/task/${id}`);
  },

  /**
   * 审批通过
   */
  completeTask: (data: any) => {
    return request.post('/workflow/task/complete', data);
  },

  /**
   * 审批驳回
   */
  rejectTask: (data: any) => {
    return request.post('/workflow/task/reject', data);
  },

  /**
   * 转办任务
   */
  transferTask: (data: any) => {
    return request.post('/workflow/task/transfer', data);
  },

  /**
   * 委派任务
   */
  delegateTask: (data: any) => {
    return request.post('/workflow/task/delegate', data);
  },

  /**
   * 撤回任务
   */
  revokeTask: (taskId: number, reason: string) => {
    return request.post(`/workflow/task/revoke/${taskId}`, { reason });
  },

  /**
   * 获取任务表单数据
   */
  getTaskFormData: (taskId: number) => {
    return request.get(`/workflow/task/form-data/${taskId}`);
  },

  /**
   * 保存任务表单数据
   */
  saveTaskFormData: (taskId: number, data: any) => {
    return request.post(`/workflow/task/form-data/${taskId}`, data);
  },

  /**
   * 获取可退回节点
   */
  getBackNodes: (taskId: number) => {
    return request.get(`/workflow/task/back-nodes/${taskId}`);
  },

  /**
   * 退回任务
   */
  backTask: (taskId: number, targetNodeId: string, reason: string) => {
    return request.post(`/workflow/task/back/${taskId}`, {
      targetNodeId,
      reason
    });
  },

  /**
   * 获取任务审批历史
   */
  getTaskHistory: (instanceId: number) => {
    return request.get(`/workflow/task/history/${instanceId}`);
  },

  /**
   * 标记任务已读
   */
  markTaskAsRead: (taskId: number) => {
    return request.post(`/workflow/task/read/${taskId}`);
  },

  /**
   * 获取待办任务数量
   */
  getTodoCount: () => {
    return request.get('/workflow/task/todo-count');
  },

  /**
   * 签收任务
   */
  claimTask: (taskId: number) => {
    return request.post(`/workflow/task/claim/${taskId}`);
  },

  /**
   * 取消签收
   */
  unclaimTask: (taskId: number) => {
    return request.post(`/workflow/task/unclaim/${taskId}`);
  }
};
