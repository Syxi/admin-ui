import { requestClient } from '#/api/request';

export interface PositionVO {
  /* */
  positionId?: string;

  /* */
  positionName?: string;

  /* */
  deptName?: string;

  /* */
  description?: string;

  /* */
  status?: number;

  /* */
  sort?: number;

  /* */
  salaryRange?: string;

  /* */
  experience?: string;

  /* */
  education?: number;

  createTime?: Date;

  updateTime?: Date;
}

export type PositionPageResult = PageResult<PositionVO[]>;

export interface PositionQuery extends PageQuery {
  positionName?: string;
}

export interface PositionForm {
  /* */
  positionId?: string;

  /* */
  positionName?: string;

  /* */
  deptId?: string;

  /* */
  description?: string;

  /* */
  status?: number;

  /* */
  sort?: number;

  /* */
  salaryRange?: string;

  /* */
  experience?: string;

  /* */
  education?: number;
}

/**
 * 岗位分页列表
 * @returns
 */
export async function selectPositionPageApi(positionQuery: PositionQuery) {
  return requestClient.get<PositionPageResult>('/sysPosition/page', {
    params: positionQuery,
  });
}

/**
 * 新增岗位
 * @returns
 * @param positionForm
 */
export async function addPositionApi(positionForm: PositionForm) {
  return requestClient.post('/sysPosition/add', positionForm);
}

/**
 * 获取岗位详情
 * @param id
 * @returns
 */
export async function getPositionApi(id: string) {
  return requestClient.get<PositionVO>(`/sysPosition/detail/${id}`);
}

/**
 * 更新岗位
 * @returns
 * @param positionForm
 */
export async function updatePositionApi(positionForm: PositionForm) {
  return requestClient.put('/sysPosition/update', positionForm);
}

/**
 * 刪除岗位
 * @param ids
 */
export async function deletePositionApi(ids: string[]) {
  return requestClient.delete('/sysPosition/delete', ids);
}
