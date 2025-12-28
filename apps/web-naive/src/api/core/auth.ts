import { baseRequestClient, requestClient } from '#/api/request';

/**
 * 登录请求参数
 */
export interface LoginParams {
  /**
   * 用户名
   */
  username: string;
  /**
   * 密码
   */
  password: string;
  /**
   * 验证码的key
   */
  captchaKey?: string;
  /**
   * 验证码图片Base64字符串
   */
  captchaCode?: string;
}

/**
 * 登录响应
 */
export interface LoginResult {
  /**
   * 访问token
   */
  accessToken: string;
  /**
   * 过期时间（单位：毫秒）
   */
  expires?: number;
  /**
   * 刷新token
   */
  refreshToken: string;
  /**
   * token类型
   */
  tokenType?: string;
}

export interface CaptchaResult {
  /**
   * 验证码缓存key
   */
  captchaKey: string;

  /**
   * 验证码图片Base64位字符串
   */
  captchaBase64: string;
}

/**
 * 登录
 * @returns
 * @param loginParams
 */
export async function loginApi(loginParams: LoginParams) {
  const formData = new FormData();
  formData.append('username', loginParams.username);
  formData.append('password', loginParams.password);
  formData.append('captchaKey', loginParams.captchaKey || '');
  formData.append('captchaCode', loginParams.captchaCode || '');
  return requestClient.post<LoginResult>('/auth/login', formData);
}

/**
 *
 * @returns 获取加密秘钥
 */
export async function getSecretKeyApi() {
  return requestClient.get<string>('/auth/aes/secretKey');
}

/**
 * 刷新 token
 * @param refreshToken
 * @returns
 */
export async function refreshTokenApi(refreshToken: string) {
  return baseRequestClient.post<LoginResult>('/auth/refreshToken', {
    refreshToken,
  });
}

/**
 * 注销登录
 * @returns
 */
export function logoutApi() {
  return requestClient.delete('/auth/logout');
}

/**
 * 生成验证码
 * @returns
 */
export async function getCaptchaApi() {
  return requestClient.get<CaptchaResult>('/auth/captcha');
}

/**
 * 验证码开关
 */
export async function switchCaptchaApi() {
  return requestClient.get<boolean>('/auth/captchaEnabled');
}
