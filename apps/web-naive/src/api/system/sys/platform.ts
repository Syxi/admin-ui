import { requestClient } from '#/api/request';

export interface Platform {
  id?: string;
  name?: string;
  path?: string;
  icon?: string;
  sort?: number;
  status?: number;
  remake?: string;
}

export interface PlatformVO {
  id?: string;
  name?: string;
  path?: string;
  icon?: string;
  sort?: number;
  status?: number;
  remake?: string;
  creatTime?: Date;
  updateTime?: Date;
}

export type PlatformPageResult = PageResult<PlatformVO[]>;

export interface PlatformQuery extends PageQuery {
  name?: string;
}

/**
 * 平台系统分页列表
 * @param platformQuery
 */
export async function selectPageApi(platformQuery: PlatformQuery) {
  return requestClient.get<PlatformPageResult>('/platform/page', {
    params: platformQuery,
  });
}

/**
 * 新增平台系统
 * @param platform
 */
export async function addPlatformApi(platform: Platform) {
  return requestClient.post('/platform/add', platform);
}

/**
 * 更新平台系统
 * @param platform
 */
export async function updatePlatformApi(platform: Platform) {
  return requestClient.put('/platform/update', platform);
}

/**
 * 获取单个平台系统信息
 * @param id
 */
export async function getPlatformInfoApi(id: string) {
  return requestClient.get<Platform>(`/platform/platformInfo/${id}`);
}

/**
 * 删除平台系统
 * @param id
 */
export async function deletePlatformApi(id: string) {
  return requestClient.delete(`/platform/delete/${id}`);
}

/**
 * 平台系统首页
 */
export async function selectPlatformHomeApi() {
  return requestClient.get<Platform[]>('/platform/home');
}
