import { acceptHMRUpdate, defineStore } from 'pinia';

interface BasicUserInfo {
  // [key: string]: any;

  // 头像
  avatar?: string;

  // 首页地址
  // homePath?: string;

  // 权限集合
  perms?: string[];

  // 用户真实姓名
  realName?: string;

  // 角色集合
  roles?: string[];

  // 用户ID
  userId?: string;

  // 用户名
  username?: string;
  /**
   * 性别
   */
  gender?: number;
  /**
   * 首页地址
   */
  homePath?: string;
  /**
   * 手机号
   */
  mobile?: string;
  /**
   * 邮箱
   */
  email?: string;
  /**
   * 职位
   */
  position?: string;
  /**
   * 部门名称
   */
  deptNames?: string;
  /**
   * 角色名称
   */
  roleNames?: string;
  /**
   * 最后登录时间
   */
  lastLoginTime?: Date;
  /**
   * 租户ID
   */
  tenantId?: string;
  /**
   * 租户名称
   */
  tenantName?: string;
}

interface AccessState {
  /**
   * 用户信息
   */
  userInfo: BasicUserInfo | null;
}

/**
 * @zh_CN 用户信息相关
 */
export const useUserStore = defineStore('core-user', {
  actions: {
    setUserInfo(userInfo: BasicUserInfo | null) {
      // 设置用户信息
      this.userInfo = userInfo;
    },
  },
  state: (): AccessState => ({
    userInfo: null,
  }),
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useUserStore, hot));
}
