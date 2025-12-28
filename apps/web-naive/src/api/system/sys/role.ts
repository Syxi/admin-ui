import { requestClient } from '#/api/request';

/**
 * 角色查询对象
 */
export interface RoleQuery extends PageQuery {
  // 角色编码
  roleCode?: string;
  // 角色名称
  roleName?: string;
  sort?: string;
  orderByColumn?: string;
  ascOrDesc?: string;
}

/**
 * 角色表格分页对象
 */
export interface RolePage {
  // 角色ID
  roleId?: string;

  // 角色编码
  roleCode?: string;

  // 角色名称
  roleName?: string;

  // 排序
  sort?: number;

  // 角色状态(1:正常；-1:停用)
  status?: number;

  // 创建时间
  createTime?: Date;

  // 更新时间
  updateTime?: Date;
}

export type RolePageResult = PageResult<RolePage[]>;

/**
 * 角色添加、编辑表单对象
 * @returns
 */
export interface RoleForm {
  // 角色ID
  roleId?: string;

  // 角色编码
  roleCode: string;

  // 角色名称
  roleName: string;

  // 数据权限
  dataScope?: number;

  // 排序
  sort?: number;

  // 角色状态(1:正常；-1:停用)
  status?: number;
}

/**
 * 角色表格分页列表
 * @returns
 * @param roleQuery
 */
export async function selectRolePageApi(roleQuery: RoleQuery) {
  return requestClient.get<RolePageResult>('/role/page', {
    params: roleQuery,
  });
}

/**
 * 角色下拉选项
 */
export async function roleOptionApi(roleQuery?: RoleQuery) {
  return requestClient.get<OptionType[]>('/role/option', {
    params: roleQuery,
  });
}

/**
 *
 * 新增角色
 * @returns
 */
export async function addRoleApi(roleForm: RoleForm) {
  return requestClient.post('/role/add', roleForm);
}

/**
 * 角色详情
 * @param roleId
 * @returns
 */
export async function roleDetailApi(roleId: string) {
  return requestClient.get<RoleForm>(`/role/detail/${roleId}`);
}

/**
 * 编辑角色
 * @returns
 * @param roleForm
 */
export async function editRoleApi(roleForm: RoleForm) {
  return requestClient.put('/role/edit', roleForm);
}

/**
 * 删除角色
 * @param roleIds
 * @returns
 */
export async function deleteRoleApi(roleIds: string[]) {
  return requestClient.delete('/role/delete', roleIds);
}

/**
 * 更新角色状态（0：正常，1：禁用）
 * @param roleId
 * @param status
 * @returns
 */
export async function updateRoleStatusApi(roleId: string, status: number) {
  return requestClient.put(`/role/${roleId}/${status}`);
}

/**
 * 启动角色
 * @returns
 * @param roleIds
 */
export async function enableRoleApi(roleIds: string[]) {
  return requestClient.put('/role/enable', roleIds);
}

/**
 * 禁用角色
 * @returns
 * @param roleIds
 */
export async function disableRoleApi(roleIds: string[]) {
  return requestClient.put('/role/disable', roleIds);
}

/**
 * 获取角色的菜单id集合
 * @param roleId
 * @returns
 */
export async function getRoleMenuIdsApi(roleId: string) {
  return requestClient.get<string[]>(`/role/${roleId}/menuIds`);
}

/**
 * 角色分配用用户， 更新角色用户关系
 * @param roleId
 * @param userIds
 * @returns
 */
export async function updateRoleUserApi(roleId: string, userIds: string[]) {
  return requestClient.put(`/role/updateRoleUser/${roleId}`, userIds);
}

/**
 * 更新角色数据权限
 * @param roleId 角色ID
 * @param dataScope 数据权限
 * @returns
 */
export async function updateRoleDataScopeApi(roleId: string, dataScope: number) {
  return requestClient.put(`/role/updateDataScope/${roleId}`,  dataScope);
}
