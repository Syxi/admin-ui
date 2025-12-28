import { requestClient } from '#/api/request';

export interface DeptVO {
  /* 组织id */
  id?: string;

  /* 组织名称 */
  deptName?: string;

  /* 组织编码 */
  deptCode?: string;

  /* 组织类型 */
  deptType?: number;

  /* 父节点id */
  parentId?: string;

  /* 父节点路径 */
  treePath?: string;

  /* 组织图标 */
  deptImg?: string;

  /* 组织简介 */
  deptIntroduction?: string;

  /* 组织联系电话 */
  deptPhone?: string;

  /* 组织地址 */
  deptAddress?: string;

  /* 备注 */
  remark?: string;

  /* 排序 */
  sort?: number;

  /* 状态 */
  status?: number;

  /* 创建时间 */
  createTime?: Date;

  /* 更新时间 */
  updateTime?: Date;

  /* 子组织 */
  children?: DeptVO[];
}

export interface DeptForm {
  /* 组织id */
  id?: string;

  /* 组织名称 */
  deptName?: string;

  /* 组织编码 */
  deptCode?: string;

  /* 组织类型 */
  deptType?: number;

  /* 父节点id */
  parentId?: string;

  /* 父节点路径 */
  treePath?: string;

  /* 组织图标 */
  deptImg?: string;

  /* 组织简介 */
  deptIntroduction?: string;

  /* 组织联系电话 */
  deptPhone?: string;

  /* 组织地址 */
  deptAddress?: string;

  /* 备注 */
  remark?: string;

  /* 排序 */
  sort?: number;

  /* 状态 */
  status?: number;

  /* 创建时间 */
  createTime?: Date;

  /* 更新时间 */
  updateTime?: Date;
}

export interface DeptQuery {
  keyWord?: string;
}

/**
 *
 * @returns 组织树
 */
export async function orgTreeApi(deptQuery: DeptQuery) {
  return requestClient.get<DeptVO[]>('/dept/tree', {
    params: deptQuery,
  });
}

/**
 * 组织下拉树
 * @returns
 */
export async function deptOptionTreeApi() {
  return requestClient.get<OptionType[]>('/dept/option');
}

/**
 * 获取组织树详情
 * @param id
 * @returns
 */
export async function getDeptDetailApi(id: string) {
  return requestClient.get<DeptVO>(`/dept/detail/${id}`);
}

/**
 * 新增组织
 * @returns
 * @param deptForm
 */
export async function addDeptApi(deptForm: DeptForm) {
  return requestClient.post('/dept/add', deptForm);
}

/**
 * 编辑组织
 */
export async function editDeptApi(deptForm: DeptForm) {
  return requestClient.put('/dept/edit', deptForm);
}

/**
 * 删除组织
 * @param id
 * @returns
 */
export async function deleteDeptApi(id: string) {
  return requestClient.delete(`/dept/${id}`);
}
