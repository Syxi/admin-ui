<script setup lang="ts">
import type { PropType } from 'vue';

import { onMounted, ref, watch } from 'vue';

import { useVModel } from '@vueuse/core';

const props = defineProps({
  api: {
    type: Function as PropType<(params: any) => Promise<unknown>>,
    default: null,
  },
  fieldName: {
    type: String,
    default: '',
  },
  uuidField: {
    type: String,
    default: 'captchaKey',
  },
  base64Field: {
    type: String,
    default: 'captchaBase64',
  },
  refresh: {
    type: Boolean,
    default: false,
  },
  params: {
    type: Object,
    default: () => {
      return {};
    },
  },
  immediate: {
    type: Boolean,
    default: true,
  },
});
const emits = defineEmits(['update:modelValue', 'update:refresh', 'register']);

const mRefresh = useVModel(props, 'refresh', emits, {
  defaultValue: props.refresh,
  passive: true,
});

const captchaKey = ref();
const captchaBase64 = ref();
const fetch = () => {
  // 从后端获取验证码
  props.api?.(props.params).then((res: any) => {
    captchaKey.value = res[props.uuidField];
    captchaBase64.value = res[props.base64Field];
    emits('update:modelValue', captchaKey.value);
    mRefresh.value = false;
  });
};
onMounted(() => {
  if (props.immediate) {
    fetch();
  }
  emits('register', {
    refresh: fetch,
  });
});
watch(
  () => mRefresh.value,
  (val) => {
    if (val) {
      fetch();
    }
  },
);
</script>
<template>
  <div class="m-captcha">
    <img :src="captchaBase64" @click="fetch" />
  </div>

</template>
<style lang="scss" scoped></style>
