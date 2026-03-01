import { requestClient as request } from '../request';

/**
 * 流程定义相关接口
 */
export const workflowDefinitionApi = {
  /**
   * 流程定义分页列表
   */
  getDefinitionPage: (params: any) => {
    return request.get('/workflow/definition/page', { params });
  },

  /**
   * 流程定义详情
   */
  getDefinitionById: (id: number) => {
    return request.get(`/workflow/definition/${id}`);
  },

  /**
   * 获取最新版本流程定义
   */
  getLatestByKey: (processKey: string) => {
    return request.get(`/workflow/definition/latest/${processKey}`);
  },

  /**
   * 新增流程定义
   */
  addDefinition: (data: any) => {
    return request.post('/workflow/definition/add', data);
  },

  /**
   * 更新流程定义
   */
  updateDefinition: (data: any) => {
    return request.put('/workflow/definition/edit', data);
  },

  /**
   * 删除流程定义
   */
  deleteDefinition: (id: number) => {
    return request.delete(`/workflow/definition/delete/${id}`);
  },

  /**
   * 发布流程定义
   */
  publishDefinition: (id: number) => {
    return request.post(`/workflow/definition/publish/${id}`);
  },

  /**
   * 停用流程定义
   */
  disableDefinition: (id: number) => {
    return request.post(`/workflow/definition/disable/${id}`);
  },

  /**
   * 复制流程定义
   */
  copyDefinition: (id: number) => {
    return request.post(`/workflow/definition/copy/${id}`);
  },

  /**
   * 获取流程分类列表
   */
  getCategoryList: () => {
    return request.get('/workflow/definition/categories');
  },

  /**
   * 获取流程XML
   */
  getProcessXml: (id: number) => {
    return request.get(`/workflow/definition/xml/${id}`);
  },

  /**
   * 获取流程图
   */
  getProcessDiagram: (id: number) => {
    return request.get(`/workflow/definition/diagram/${id}`);
  },

  /**
   * 导入流程定义
   */
  importDefinition: (data: any) => {
    return request.post('/workflow/definition/import', data);
  },

  /**
   * 导出流程定义
   */
  exportDefinition: (id: number) => {
    return request.get(`/workflow/definition/export/${id}`, {
      responseType: 'blob'
    });
  },

  /**
   * 部署流程定义
   */
  deployDefinition: (id: number) => {
    return request.post(`/workflow/definition/deploy/${id}`);
  },

  /**
   * 取消部署
   */
  undeployDefinition: (id: number) => {
    return request.post(`/workflow/definition/undeploy/${id}`);
  },

  /**
   * 测试流程定义
   */
  testDefinition: (data: any) => {
    return request.post('/workflow/definition/test', data);
  }
};
