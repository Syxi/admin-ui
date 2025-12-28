<script setup lang="ts">
import type {
  ScheduledJobLogPage,
  ScheduledJobLogQuery,
} from '#/api/system/log/scheduledJobLog';

import { h, onMounted, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NButton, NDataTable, NPagination, NIcon, NSpace, NSelect, NTag } from 'naive-ui';

import { selectJobBeanNameListApi } from '#/api/system/log/scheduledJob';
import { selectScheduledJobLogPageApi } from '#/api/system/log/scheduledJobLog';
import { useCardHeight } from '#/hooks/useCardHeight';
import {useTableHeight} from "#/hooks/useTableHeight";
import { Search, Refresh } from '@vben/icons';

defineOptions({
  name: 'ScheduledJobLog',
  inheritAttrs: false,
});

const queryFormRef = ref();

const loading = ref(false);

const total = ref(0);

const queryParams = reactive<ScheduledJobLogQuery>({
  page: 1,
  limit: 20,
});

const jobLogList = ref<ScheduledJobLogPage[]>();

const beanNameOptions = ref<string[]>([]);

/**
 * 查询定时任务
 */
function handleQuery() {
  loading.value = true;
  selectScheduledJobLogPageApi(queryParams)
    .then((data) => {
      jobLogList.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

/**
 * 重置查询
 */
function resetQuery() {
  queryFormRef.value?.restoreValidation();
  queryParams.page = 1;
  handleQuery();
}

function handleJobBeanName() {
  selectJobBeanNameListApi().then((data) => {
    beanNameOptions.value = data;
  });
}

onMounted(() => {
  handleQuery();
  handleJobBeanName();
});

const { tableHeight } = useTableHeight(queryFormRef);
</script>

<template>
  <div class="app-container">
      <NForm ref="queryFormRef" :model="queryParams" :inline="true">
        <NFormItem prop="jobName">
          <NInput
            v-model:value="queryParams.jobName"
            placeholder="定时任务名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </NFormItem>

        <NFormItem prop="beanName">
          <NSelect
            v-model:value="queryParams.beanName"
            placeholder="定时任务beanName"
            clearable
            style="width: 240px"
            @update:value="handleQuery"
            :options="beanNameOptions.map(item => ({ label: item, value: item }))"
          />
        </NFormItem>

        <NFormItem prop="status">
          <NSelect
            v-model:value="queryParams.status"
            placeholder="定时任务状态"
            clearable
            style="width: 140px"
            @update:value="handleQuery()"
            :options="[
              { label: '正常', value: '1' },
              { label: '禁用', value: '-1' }
            ]"
          />
        </NFormItem>

        <NFormItem>
          <NButton type="primary" @click="handleQuery">
            <template #icon>
              <NIcon><Search /></NIcon>
            </template>
            搜索
          </NButton>

          <NButton type="primary" @click="resetQuery">
            <template #icon>
              <NIcon><Refresh /></NIcon>
            </template>
            重置
          </NButton>
        </NFormItem>
      </NForm>

      <NDataTable
        :loading="loading"
        :data="jobLogList"
        :columns="[
          {
            type: 'selection',
            width: 80,
            align: 'center'
          },
          {
            title: '定时任务名称',
            key: 'jobName',
            align: 'center'
          },
          {
            title: '定时任务Bean',
            key: 'beanName',
            width: 500,
            align: 'center'
          },
          {
            title: '状态',
            key: 'status',
            align: 'center',
            render: (row) => {
              return row.status === 1 
                ? h(NTag, { type: 'success' }, { default: () => '正常' })
                : h(NTag, { type: 'info' }, { default: () => '暂停' });
            }
          },
          {
            title: '耗时（毫秒）',
            key: 'executeTime',
            align: 'center'
          },
          {
            title: '执行时间',
            key: 'startTime',
            align: 'center'
          }
        ]"
        :pagination="{
          page: queryParams.page,
          pageSize: queryParams.limit,
          itemCount: total,
          showSizePicker: true,
          pageSizes: [10, 20, 30, 40, 50, 100],
          onUpdatePage: (page) => {
            queryParams.page = page;
            handleQuery();
          },
          onUpdatePageSize: (pageSize) => {
            queryParams.limit = pageSize;
            queryParams.page = 1;
            handleQuery();
          }
        }"
      />
  </div>
</template>