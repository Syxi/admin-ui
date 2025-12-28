/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { ElMessage, ElMessageBox } from 'element-plus';

import { refreshTokenApi } from '#/api/core';
import { useAuthStore } from '#/store';

// 采用 dev或prod 环境
const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL, // 后端地址
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    const authStore = useAuthStore();

    try {
      await ElMessageBox.alert('会话已过期，请重新登录', '警告', {
        confirmButtonText: '确认',
        type: 'warning',
        center: true,
      });
      await authStore.logout();
    } catch {
      // 用户可能点了取消，也强制登出（或跳转登录）
      await authStore.logout();
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const response = await refreshTokenApi(accessStore.refreshToken);
    const accessToken = response.data.data.accessToken;
    accessStore.setAccessToken(accessToken);
    return accessToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头拦截处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: '200',
    }),
  );

  // 通用错误处理
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 这里可以根据业务进行定制,你可以拿到 error 内的信息进行定制化处理，根据不同的 code 做不同的提示，而不是直接使用 message.error 提示 msg
      // 当前mock接口返回的错误字段是 error 或者 message
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData.msg;
      // refreshToken未过期，刷新accessToken
      if (responseData.code === 'A320') {
        return;
      }

      // 如果没有错误信息，则会根据状态码进行提示
      ElMessage.error(errorMessage || msg);
    }),
  );

  // token过期的处理,过期重试刷新token和刷新token过期就登出
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: true,
      formatToken,
    }),
  );

  return client;
}

// export const requestClient = createRequestClient(apiURL, {
//   responseReturn: 'data',
// });

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
