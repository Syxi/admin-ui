<script setup lang="ts">
import type { FormInst } from 'naive-ui';

import type { LoginParams } from '#/api';

import { computed, onBeforeMount, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { NForm, NFormItem, NInput, NInputGroup, NButton, NIcon } from 'naive-ui';

import { getCaptchaApi, switchCaptchaApi } from '#/api';
import { useAuthStore } from '#/store';

const isCapslock = ref(false);

const captchaBase64 = ref('');

const loginTitle = import.meta.env.VITE_APP_LOGIN_TITLE;

// 验证码开关
const captchaEnabled = ref(false);

// 登录表单 ref
const loginFormRef = ref<FormInst>();

const params = ref<LoginParams>({
  username: '',
  password: '',
  captchaKey: '',
  captchaCode: '',
});

// 校验登录表单内容
const loginRules = computed(() => {
  return {
    username: {
      required: true,
      message: '请输入用户名',
      trigger: ['input', 'blur']
    },
    password: {
      required: true,
      validator: (rule: any, value: any) => {
        if (!value) {
          return new Error('请输入用密码');
        }
        if (value.length < 6) {
          return new Error('密码至少是6位');
        }
        return true;
      },
      trigger: ['input', 'blur']
    },
    captchaCode: {
      required: true,
      message: '请输入验证码',
      trigger: ['input', 'blur']
    },
  };
});

/**
 * 切换验证码
 */
async function showCaptcha() {
  captchaEnabled.value = await switchCaptchaApi();
  if (captchaEnabled.value) {
    await getCaptcha();
  }
}

/** 检查输入大小写 */
function checkCapslock(event: KeyboardEvent) {
  // 防止浏览器密码自动填充时报错
  if (event instanceof KeyboardEvent) {
    isCapslock.value = event.getModifierState('CapsLock');
  }
}

const authStore = useAuthStore();

async function handleLogin() {
  try {
    await loginFormRef.value?.validate();
    // 登录
    try {
      await authStore.authLogin(params.value);
    } catch {
      // 登录异常，刷新验证码
      captchaBase64.value = '';
      const data = await getCaptchaApi();
      params.value.captchaKey = data.captchaKey;
      captchaBase64.value = data.captchaBase64;
    }
  } catch (error) {
    console.error('表单验证失败:', error);
  }
}

async function getCaptcha() {
  const data = await getCaptchaApi();
  params.value.captchaKey = data.captchaKey;
  captchaBase64.value = data.captchaBase64;
}

onBeforeMount(() => {
  showCaptcha();
});
</script>

<template>
  <div>
    <!-- 登录系统名称 -->
    <div class="title relative mx-2 text-center">
      <h1>{{ loginTitle }}</h1>
    </div>

    <n-form ref="loginFormRef" :model="params" :rules="loginRules" size="large">
      <!-- 用户名 -->
      <n-form-item path="username">
        <n-input
          v-model:value="params.username"
          name="username"
          placeholder="用户名"
        >
          <template #prefix>
            <n-icon>
              <Icon icon="mdi:account-outline" />
            </n-icon>
          </template>
        </n-input>
      </n-form-item>

      <!-- 密码 -->
      <n-form-item path="password">
        <n-input
          v-model:value="params.password"
          name="password"
          type="password"
          placeholder="密码"
          @keyup="checkCapslock"
          @keyup.enter="handleLogin()"
        >
          <template #prefix>
            <n-icon>
              <Icon icon="mdi:lock-outline" />
            </n-icon>
          </template>
        </n-input>
        <div v-if="isCapslock" class="text-xs text-red-500 mt-1">大写锁定已开启</div>
      </n-form-item>

      <n-form-item path="captchaCode" v-if="captchaEnabled">
        <n-input-group>
          <n-input
            v-model:value="params.captchaCode"
            placeholder="验证码"
            @keyup.enter="handleLogin()"
          >
            <template #prefix>
              <n-icon>
                <Icon icon="mdi:shield-account-outline" />
              </n-icon>
            </template>
          </n-input>
          <n-button @click="getCaptcha()" ghost>
            <img :src="captchaBase64" alt="验证码" style="height: 40px; width: 100px;" />
          </n-button>
        </n-input-group>
      </n-form-item>

      <!-- 点击登录 -->
      <n-button
        :loading="authStore.loginLoading"
        @click.prevent="handleLogin"
        class="w-full"
        type="primary"
        size="large"
      >
        登录
      </n-button>
    </n-form>
  </div>
</template>

<style lang="scss" scoped>
.n-form {
  padding: 30px 10px;
}

.title {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.75rem;
}
</style>
