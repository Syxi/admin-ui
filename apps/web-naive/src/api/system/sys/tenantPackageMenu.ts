import { requestClient } from '#/api/request';

// 获取套餐已分配的菜单列表
export async function getAssignedMenusApi(packageId: string) {
  return requestClient.get(`/tenantPackage/menu/assignedMenus/${packageId}`);
}

// 为套餐分配菜单权限
export async function assignMenusToPackageApi(packageId: string, menuIds: string[]) {
  return requestClient.post(`/tenantPackage/menu/assignMenus/${packageId}`, menuIds);
}