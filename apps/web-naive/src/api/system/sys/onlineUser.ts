import { requestClient } from '#/api/request';

export interface OnlineUserVO {
  userId?: string;

  username?: string;

  loginTime?: Date;
}

export type OnlineUserPageResult = PageResult<OnlineUserVO[]>;

export interface OnlineUserQuery extends PageQuery {
  username?: string;
}

/**
 * 获取在线用户分页列表
 * @param onlineUserQuery
 */
export async function selectOnlineUserPageApi(onlineUserQuery: OnlineUserQuery) {
  return requestClient.get<OnlineUserPageResult>('/onLineUser/page', {
    params: onlineUserQuery,
  });
}

/**
 * 踢用户强制下线
 * @param username
 */
export async function kickoutUserApi(username: string) {
  return requestClient.delete(`/onLineUser/forceLogout/${username}`);
}
