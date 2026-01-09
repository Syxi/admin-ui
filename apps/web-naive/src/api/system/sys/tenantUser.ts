import { requestClient } from '#/api/request';

/**
 * 租户用户关联表单对象
 */
export interface TenantUserForm {
  userId?: string;
  tenantId?: string;
}

/**
 * 切换租户
 * @param tenantId 租户ID
 * @returns
 */
export async function switchTenantApi(tenantId: string) {
  return requestClient.put('/tenant/switch', { tenantId });
}

/**
 * 获取用户可访问的租户列表
 * @returns
 */
export async function getUserTenantsApi() {
  return requestClient.get<TenantUserForm[]>('/tenant/userTenants');
}