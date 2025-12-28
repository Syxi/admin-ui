import { requestClient } from '#/api/request';
import { MenuTypeEnum } from '#/enums/MenuTypesEnum';

/**
 * 菜单查询对象类型
 */
export interface MenuQuery {
  menuName?: string;
}

/**
 * 菜单视图对象类型
 */
export interface MenuVO {
  // 菜单ID
  menuId?: string;

  // 菜单名称
  menuName?: string;

  // 菜单类型(1-菜单；2-目录；3-外链；4-按钮权限)
  menuType?: MenuTypeEnum;

  // 父菜单ID
  parentId?: string;

  // 菜单图标
  icon?: string;

  // 组件路径
  component?: string;

  // 权限标识
  perm?: string;

  // 跳转路径
  redirect?: string;

  // 路由名称
  routeName?: string;

  // 路由相对路径
  routePath?: string;

  // 菜单排序(数字越小排名越靠前)
  sort?: number;

  // 菜单是否可见(0:显示;1:隐藏)
  status?: number;

  // 子菜单
  children?: MenuVO[];
}

interface KeyValue {
  key: string;
  value: string;
}

/**
 * 菜单表单对象类型
 */
export interface MenuForm {
  // 菜单ID
  menuId?: string;

  // 菜单名称
  menuName?: string;

  // 菜单类型(1-菜单；2-目录；3-外链；4-按钮权限)
  menuType?: MenuTypeEnum;

  // 父菜单ID
  parentId?: string;

  // 菜单图标
  icon?: string;

  // 组件路径
  component?: string;

  // 权限标识
  perm?: string;

  // 跳转路由路径
  redirect?: string;

  // 路由名称
  routeName?: string;

  // 路由相对路径
  routePath?: string;

  // 菜单排序(数字越小排名越靠前)
  sort?: number;

  // 菜单是否可见(0:显示;1:隐藏)
  status?: number;

  // 菜单是否开启页面缓存
  keepAlive?: number;

  // 目录只有一个子路由是否始终显示
  alwaysShow?: number;

  // 路由参数
  params?: KeyValue[];
}

/**
 * 菜单树形列表
 * @returns
 * @param menuQuery
 */
export async function selectMenuTreeApi(menuQuery: MenuQuery) {
  return requestClient.get<MenuVO[]>('/menu/page', {
    params: menuQuery,
  });
}

/**
 * 菜单下拉列表
 * @returns
 */
export async function menuOptionApi() {
  return requestClient.get<OptionType[]>('/menu/option');
}

/**
 * 新增菜单
 * @returns
 * @param menuForm
 */
export async function addMenuApi(menuForm: MenuForm) {
  return requestClient.post('/menu/add', menuForm);
}

/**
 * 编辑菜单
 * @returns
 * @param menuForm
 */
export async function editMenuApi(menuForm: MenuForm) {
  return requestClient.put('/menu/edit', menuForm);
}

/**
 * 菜单详情
 * @param {string} menuId menuId
 * @returns
 */
export async function getMenuDetailApi(menuId: string) {
  return requestClient.get<MenuForm>(`/menu/detail/${menuId}`);
}

/**
 * 删除菜单
 * @param {string} menuId menuId
 * @returns
 */
export async function deleteMenuApi(menuId: string) {
  return requestClient.delete(`/menu/delete/${menuId}`);
}

/**
 * 角色分配菜单
 * @param roleId
 * @param menus
 * @returns
 */
export async function updateRoleMenusApi(roleId: string, menus: string[]) {
  return requestClient.put<any>(`/menu/${roleId}/menus`, menus);
}
