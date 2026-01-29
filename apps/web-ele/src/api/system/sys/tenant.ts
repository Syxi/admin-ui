import { requestClient } from '#/api/request';

/**
 * 租户查询对象
 */
export interface TenantQuery extends PageQuery {
  name?: string;
  code?: string;
}

/**
 * 角色表格分页对象
 */
export interface TenantPage {
  id?: string;

  code?: string;

  name?: string;

  sort?: number;

  status?: number;

  remark?: string;

  createTime?: Date;

  updateTime?: Date;
}

export type TenantPageResult = PageResult<TenantPage[]>;

/**
 * 租户添加、编辑表单对象
 * @returns
 */
export interface TenantForm {
  id?: string;

  code: string;

  name: string;

  sort?: number;

  status?: number;

  remark?: string;
}

/**
 * 租户表格分页列表
 * @returns
 * @param tenantQuery
 */
export async function selectTenantPageApi(tenantQuery: TenantQuery) {
  return requestClient.get<TenantPageResult>('/tenant/page', {
    params: tenantQuery,
  });
}


/**
 *
 * 新增租户
 * @returns
 */
export async function addTenantApi(tenantForm: TenantForm) {
  return requestClient.post('/tenant/add', tenantForm);
}

/**
 * 租户详情
 * @param id
 * @returns
 */
export async function tenantDetailApi(id: string) {
  return requestClient.get<TenantForm>(`/tenant/detail/${id}`);
}

/**
 * 编辑租户
 * @returns
 * @param tenantForm
 */
export async function editTenantApi(tenantForm: TenantForm) {
  return requestClient.put('/tenant/edit', tenantForm);
}

/**
 * 删除租户
 * @param ids
 * @returns
 */
export async function deleteTenantApi(ids: string[]) {
  return requestClient.delete('/tenant/delete', ids);
}

/**
 * 租户分配用用户， 更新租户用户关系
 * @param id
 * @param userIds
 * @returns
 */
export async function updateTenantUsersApi(id: string, userIds: string[]) {
  return requestClient.put(`/tenant/addUser/${id}`, userIds);
}


/**
 * 分页获取租户下所有用户
 * @returns
 * @param id
 * @param pageNum
 * @param pageSize
 */
export async function usersInTenantPageApi(id: string, pageNum: number = 1, pageSize: number = 10, keyword?: string) {
  const params = new URLSearchParams();
  params.append('pageNum', pageNum.toString());
  params.append('pageSize', pageSize.toString());
  if (keyword) {
    params.append('keyword', keyword);
  }
  return requestClient.get<IPage<TransferVO>>(`/tenant/userInTenant/page/${id}?${params.toString()}`);
}

/**
 * 分页获取未分配租户的所有用户
 * @returns
 * @param id
 * @param pageNum
 * @param pageSize
 * @param keyword
 */
export async function userNotInTenantPageApi(id: string, pageNum: number = 1, pageSize: number = 10, keyword?: string) {
  const params = new URLSearchParams();
  params.append('pageNum', pageNum.toString());
  params.append('pageSize', pageSize.toString());
  if (keyword) {
    params.append('keyword', keyword);
  }
  return requestClient.get<IPage<TransferVO>>(`/tenant/userNotInTenant/page/${id}?${params.toString()}`);
}
