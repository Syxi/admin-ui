import type { UserInfo } from '@vben/types';

import type { LoginParams, LoginResult } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DEFAULT_HOME_PATH, LOGIN_PATH } from '@vben/constants';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { ElNotification } from 'element-plus';
import { JSEncrypt } from 'jsencrypt';
import { defineStore } from 'pinia';

import { getSecretKeyApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   * @param onSuccess
   */
  async function authLogin(
    params: LoginParams,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 公钥
    const publicKeyStr = ref('');

    // 获取aes加密的公钥
    publicKeyStr.value = await getSecretKeyApi();

    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      // 账号加密后的登录参数
      const encryptData = {
        username: '',
        password: '',
        captchaKey: params.captchaKey,
        captchaCode: params.captchaCode,
      };
      // 加密登录账号
      const encrypt = new JSEncrypt();
      // 设置加密的公钥
      encrypt.setPublicKey(publicKeyStr.value);
      const encryptUsername = encrypt.encrypt(params.username);
      const encryptPassword = encrypt.encrypt(params.password);
      if (encryptUsername && encryptPassword) {
        encryptData.username = encryptUsername;
        encryptData.password = encryptPassword;
      } else {
        encryptData.username = params.username;
        encryptData.password = params.password;
      }

      const loginResult: LoginResult = await loginApi(encryptData);

      // 如果成功获取到 accessToken
      if (loginResult.accessToken) {
        // 将 accessToken 存储到 accessStore 中
        accessStore.setAccessToken(loginResult.accessToken);
        // 将 refreshToken 存储到 accessStore 中
        accessStore.setRefreshToken(loginResult.refreshToken);

        // 获取用户信息并存储到 userStore 中
        userInfo = await fetchUserInfo();
        if (userInfo) {
          // 权限信息并存储到 accessStore 中
          accessStore.setAccessCodes(userInfo.perms);
        }

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(DEFAULT_HOME_PATH);
        }

        if (userInfo?.realName) {
          ElNotification({
            message: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            title: $t('authentication.loginSuccess'),
            type: 'success',
          });
        }
      }
    } catch (error) {
      throw error;
    } finally {
      loginLoading.value = false;
      publicKeyStr.value = '';
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = false) {
    // try {
    //
    // } catch {
    //   // 不做任何处理
    // }
    logoutApi().then(() => {
      resetAllStores();
      router.removeRoute('/');
      accessStore.setLoginExpired(false);

      // 回登录页带上当前路由地址
      router.replace({
        path: LOGIN_PATH,
        query: redirect
          ? {
              redirect: encodeURIComponent(router.currentRoute.value.fullPath),
            }
          : {},
      });
    });
  }

  async function fetchUserInfo() {
    let userInfo: null | UserInfo = null;
    userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
