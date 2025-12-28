import { requestClient } from '#/api/request';

/**
 * 操作日志
 */
export interface OperationLog {
  id: string;
  userId: string;
  username: string;
  operation: string;
  method: string;
  params: string;
  ip: string;
  address: string;
  createTime: Date;
}

// 操作日志分页类型声明
export type OperationLogPageResult = PageResult<OperationLog[]>;

/**
 * 操作日志查询参数
 */
export interface OperationLogQuery extends PageQuery {
  username?: string;
}

/**
 * 登录日志
 */
export interface LoginLog {
  id: string;
  username: string;
  ip: string;
  address: string;
  os: string;
  browser: string;
  loginTime: Date;
}

// 登录日志分页类型声明
export type LoginLogPageResult = PageResult<LoginLog[]>;

/**
 * 登录日志查询参数
 */
export interface LoginLogQuery extends PageQuery {
  username?: string;
}

/**
 * 用户操作日志
 * @returns
 * @param operationLogQuery
 */
export async function selectOperationLogPageApi(
  operationLogQuery: OperationLogQuery,
) {
  return requestClient.get<OperationLogPageResult>('/log/userOperationLog', {
    params: operationLogQuery,
  });
}

/**
 * 登录日志
 * @returns
 * @param loginLogQuery
 */
export async function selectLoginLogPageApi(loginLogQuery: LoginLogQuery) {
  return requestClient.get<LoginLogPageResult>('/log/loginLog', {
    params: loginLogQuery,
  });
}
