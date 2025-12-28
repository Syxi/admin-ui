import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 登录成功后，获取用户信息（昵称、头像、权限集合、角色集合）
 * @returns 用户信息
 */
export function getUserInfoApi() {
  return requestClient.get<UserInfo>('/user/userInfo');
}
