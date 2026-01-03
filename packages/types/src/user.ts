/** 用户信息 */
interface UserInfo {
  /**
   * 头像
   */
  avatar?: string;
  /**
   * 权限标识
   */
  perms?: string[];
  /**
   * 用户角色编码
   */
  roles?: string[];
  /**
   * 用户id
   */
  userId: string;
  /**
   * 用户名
   */
  username: string;
  /**
   * 用户昵称
   */
  realName: string;
  /**
   * 手机号
   */
  phone?: string;
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

export type { UserInfo };
