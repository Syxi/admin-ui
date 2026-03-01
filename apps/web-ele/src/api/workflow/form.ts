import { requestClient as request } from '../request';

/**
 * 流程表单相关接口
 */
export const workflowFormApi = {
  /**
   * 表单分页列表
   */
  getFormPage: (params: any) => {
    return request.get('/workflow/form/page', { params });
  },

  /**
   * 表单详情
   */
  getFormById: (id: number) => {
    return request.get(`/workflow/form/${id}`);
  },

  /**
   * 根据编码获取表单
   */
  getFormByCode: (formCode: string) => {
    return request.get(`/workflow/form/code/${formCode}`);
  },

  /**
   * 新增表单
   */
  addForm: (data: any) => {
    return request.post('/workflow/form/add', data);
  },

  /**
   * 更新表单
   */
  updateForm: (data: any) => {
    return request.put('/workflow/form/edit', data);
  },

  /**
   * 删除表单
   */
  deleteForm: (id: number) => {
    return request.delete(`/workflow/form/delete/${id}`);
  },

  /**
   * 发布表单
   */
  publishForm: (id: number) => {
    return request.post(`/workflow/form/publish/${id}`);
  },

  /**
   * 停用表单
   */
  disableForm: (id: number) => {
    return request.post(`/workflow/form/disable/${id}`);
  },

  /**
   * 获取表单分类列表
   */
  getCategoryList: () => {
    return request.get('/workflow/form/categories');
  },

  /**
   * 获取表单字段
   */
  getFormFields: (formId: number) => {
    return request.get(`/workflow/form/fields/${formId}`);
  },

  /**
   * 验证表单数据
   */
  validateFormData: (formId: number, data: any) => {
    return request.post(`/workflow/form/validate/${formId}`, data);
  },

  /**
   * 获取已发布的表单列表
   */
  getPublishedForms: () => {
    return request.get('/workflow/form/published');
  }
};
