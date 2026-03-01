import { requestClient as request } from '../request';

/**
 * 流程实例相关接口
 */
export const workflowInstanceApi = {
  /**
   * 流程实例分页列表
   */
  getInstancePage: (params: any) => {
    return request.get('/workflow/instance/page', { params });
  },

  /**
   * 流程实例详情
   */
  getInstanceById: (id: number) => {
    return request.get(`/workflow/instance/${id}`);
  },

  /**
   * 根据业务Key获取流程实例
   */
  getInstanceByBusinessKey: (businessKey: string) => {
    return request.get(`/workflow/instance/business/${businessKey}`);
  },

  /**
   * 启动流程实例
   */
  startProcess: (data: any) => {
    return request.post('/workflow/instance/start', data);
  },

  /**
   * 终止流程实例
   */
  terminateInstance: (id: number, reason: string) => {
    return request.post(`/workflow/instance/terminate/${id}`, { reason });
  },

  /**
   * 挂起流程实例
   */
  suspendInstance: (id: number) => {
    return request.post(`/workflow/instance/suspend/${id}`);
  },

  /**
   * 激活流程实例
   */
  activateInstance: (id: number) => {
    return request.post(`/workflow/instance/activate/${id}`);
  },

  /**
   * 撤回流程实例
   */
  revokeInstance: (id: number, reason: string) => {
    return request.post(`/workflow/instance/revoke/${id}`, { reason });
  },

  /**
   * 获取流程实例变量
   */
  getInstanceVariables: (id: number) => {
    return request.get(`/workflow/instance/variables/${id}`);
  },

  /**
   * 更新流程实例变量
   */
  updateInstanceVariables: (id: number, data: any) => {
    return request.put(`/workflow/instance/variables/${id}`, data);
  },

  /**
   * 获取流程实例历史
   */
  getInstanceHistory: (id: number) => {
    return request.get(`/workflow/instance/history/${id}`);
  },

  /**
   * 获取流程实例审批轨迹
   */
  getApprovalTrack: (id: number) => {
    return request.get(`/workflow/instance/track/${id}`);
  },

  /**
   * 获取流程实例时间线
   */
  getInstanceTimeline: (id: number) => {
    return request.get(`/workflow/instance/timeline/${id}`);
  },

  /**
   * 批量终止流程实例
   */
  batchTerminate: (ids: number[]) => {
    return request.post('/workflow/instance/batch-terminate', { ids });
  },

  /**
   * 批量删除流程实例
   */
  batchDelete: (ids: number[]) => {
    return request.post('/workflow/instance/batch-delete', { ids });
  },

  /**
   * 统计流程实例
   */
  getInstanceStatistics: (params: any) => {
    return request.get('/workflow/instance/statistics', { params });
  }
};
