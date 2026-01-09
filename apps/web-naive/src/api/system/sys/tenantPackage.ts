import { requestClient } from '#/api/request';

export interface TenantPackage {
  id?: string;
  name: string;
  code: string;
  description?: string;
  maxUsers?: number;
  maxStorage?: number;
  validityDays?: number;
  status: number;
  sort?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface TenantPackagePage {
  id: string;
  name: string;
  code: string;
  description?: string;
  maxUsers?: number;
  maxStorage?: number;
  validityDays?: number;
  status: number;
  sort?: number;
  remark?: string;
  createTime: string;
  updateTime: string;
}

export interface TenantPackageQuery extends PageQuery {
  name?: string;
  code?: string;
  status?: number;
}

export type TenantPackagePageResult = PageResult<TenantPackagePage[]>;

// 租户套餐相关API
// 获取租户套餐列表
export async function selectTenantPackageListApi() {
  return requestClient.get<TenantPackage[]>('/tenantPackage/list');
}

// 获取租户套餐分页列表
export async function selectTenantPackagePageApi(params: TenantPackageQuery) {
  return requestClient.get<TenantPackagePageResult>('/tenantPackage/page', {
    params,
  });
}

// 获取租户套餐详情
export async function tenantPackageDetailApi(id: string) {
  return requestClient.get<TenantPackage>(`/tenantPackage/detail/${id}`);
}

// 新增租户套餐
export async function addTenantPackageApi(tenantPackage: TenantPackage) {
  return requestClient.post('/tenantPackage/add', tenantPackage);
}

// 更新租户套餐
export async function editTenantPackageApi(tenantPackage: TenantPackage) {
  return requestClient.put('/tenantPackage/update', tenantPackage);
}

// 删除租户套餐
export async function deleteTenantPackageApi(ids: string) {
  return requestClient.delete(`/tenantPackage/delete/${ids}`);
}

// 为租户分配套餐
export async function assignTenantPackageApi(tenantId: string, packageId: string) {
  return requestClient.post(`/tenantPackage/assign/assign?tenantId=${tenantId}&packageId=${packageId}`);
}

// 获取租户当前套餐信息
export async function getCurrentTenantPackageApi(tenantId: string) {
  return requestClient.get(`/tenantPackage/assign/current/${tenantId}`);
}