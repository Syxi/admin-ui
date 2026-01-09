<script setup lang="ts">
import type { Ref } from 'vue';

import { onBeforeMount, ref, watch } from 'vue';

import { NSelect } from 'naive-ui';

import { getDictOptionsApi } from '#/api/system/sys/dictValue';

const props = defineProps({
  // 字典类型编码
  typeCode: {
    type: String,
    required: true,
  },
  modelValue: {
    type: [String, Number],
  },
  placeholder: {
    type: String,
    default: '请选择',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

// 父组件监听事件，同步子组件值的变化给父组件
const emits = defineEmits(['update:modelValue']);

// 字典下来数据源
const options: Ref<OptionType[]> = ref([]);

const selectedValue = ref<number | string | undefined>();

watch([options, () => props.modelValue], ([newOptions, newModelValue]) => {
  // 下拉数据源加载未完成不回显
  if (newOptions.length === 0) return;
  if (newModelValue === undefined) {
    selectedValue.value = undefined;
    return;
  }
  if (typeof newOptions[0].value === 'number') {
    selectedValue.value = Number(newModelValue);
  } else if (typeof newOptions[0].value === 'string') {
    selectedValue.value = String(newModelValue);
  } else {
    selectedValue.value = newModelValue;
  }
});

function handleChange(val?: number | string | undefined) {
  emits('update:modelValue', val);
}

onBeforeMount(async () => {
  // 根据字典类型编码，获取字典选项
  getDictOptionsApi(props.typeCode).then((data) => {
    options.value = data;
  });
});
</script>

<template>
  <NSelect
    v-model:value="selectedValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :options="options"
    :clearable="true"
    @update-value="handleChange"
  />
</template>
