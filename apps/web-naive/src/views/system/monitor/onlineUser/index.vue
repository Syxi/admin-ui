<script setup lang="ts">
import type {
  OnlineUserQuery,
  OnlineUserVO,
} from '#/api/system/sys/onlineUser';

import { onMounted, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NButton, NDataTable, NPagination, NIcon } from 'naive-ui';

import { message, modal } from '#/hooks';

import {
  kickoutUserApi,
  selectOnlineUserPageApi,
} from '#/api/system/sys/onlineUser';
import {useTableHeight} from "#/hooks/useTableHeight";

const queryFormRef = ref();
const total = ref();
const queryFormParams = reactive<OnlineUserQuery>({
  limit: 10,
  page: 1,
});

const loading = ref(false);

const onlineUserData = ref<OnlineUserVO[]>([]);

async function handleQuery() {
  loading.value = true;
  selectOnlineUserPageApi(queryFormParams)
    .then((data) => {
      onlineUserData.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

/**
 * 重置查询
 */
async function resetQuery() {
  queryFormRef.value.resetFields();
  queryFormParams.username = '';
  await handleQuery();
}

// async function kickoutUser(username: string) {
//   modal.confirm({
//     title: '提示',
//     content: '确定要强制下线吗？',
//     positiveText: '确定',
//     negativeText: '取消',
//     onPositiveClick: () => {
//       kickoutUserApi(username).then(() => {
//         message.success('强制下线成功！');
//         resetQuery();
//       });
//     },
//     onNegativeClick: () => {
//       message.error('强制下线失败！');
//     }
//   });
// }

onMounted(() => {
  handleQuery();
});

const { tableHeight } = useTableHeight(queryFormRef);
</script>

<template>
  <div class="app-container">
      <NForm
        ref="queryFormRef"
        :model="queryFormParams"
        :inline="true"
        @submit.prevent
      >
        <NFormItem prop="username">
          <NInput
            placeholder="用户名"
            v-model="queryFormParams.username"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery()"
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleQuery()">
            查询
          </NButton>
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="resetQuery()">重置</NButton>
        </NFormItem>
      </NForm>
      <NDataTable
        :data="onlineUserData"
        :loading="loading"
        :max-height="tableHeight"
        :columns="[
          { title: '用户名', key: 'username' },
          { title: '登录时间', key: 'loginTime' }
        ]"
      />

      <NPagination
        v-if="total > 0"
        v-model:page="queryFormParams.page"
        v-model:page-size="queryFormParams.limit"
        :page-count="Math.ceil(total / queryFormParams.limit)"
        :page-sizes="[10, 20, 30, 40, 50, 100]"
        @update:page="handleQuery"
        @update:page-size="handleQuery"
      />
  </div>
</template>