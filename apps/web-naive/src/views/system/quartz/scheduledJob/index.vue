<script setup lang="ts">
import type {
  ScheduledJobPage,
  ScheduledJobQuery,
} from '#/api/system/log/scheduledJob';

import { h, onMounted, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NButton, NDataTable, NPagination, NIcon, NSpace, NSelect, NTag } from 'naive-ui';
import { message, dialog } from '#/hooks';

import {
  deleteScheduledJobApi,
  executeJobsApi,
  pauseJobsApi,
  scheduledJobPageApi,
  selectJobBeanNameListApi,
} from '#/api/system/log/scheduledJob';
import { useCardHeight } from '#/hooks/useCardHeight';
import ScheduledJobFormDialog from '#/views/system/quartz/scheduledJob/ScheduledJobFormDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";
import { Icon } from '@iconify/vue';

defineOptions({
  name: 'ScheduledJob',
  inheritAttrs: false,
});

const queryFormRef = ref();

const loading = ref(false);

const jobIds = ref<string[]>([]);

const jobClassNameOptions = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<ScheduledJobQuery>({
  page: 1,
  limit: 20,
});

const scheduledJobList = ref<ScheduledJobPage[]>();

// 表单弹窗子组件
const scheduledJobDialogRef = ref();
function openDialog(id?: string) {
  scheduledJobDialogRef.value.openDialog(id, jobClassNameOptions.value);
}

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any[]) {
  // 没有选中项，情况jobIds
  jobIds.value = selection.map((item: any) => item.jobId); // 多选
}

/**
 * 查询定时任务
 */
function handleQuery() {
  loading.value = true;
  scheduledJobPageApi(queryParams)
    .then((data) => {
      scheduledJobList.value = data.list;
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
  queryFormRef.value.resetFields();
  queryParams.page = 1;
  handleQuery();
}

/**
 * 删除定时任务
 * @param roleId
 */
function handleDelete(jobId?: string) {
  let ids: string[];
  if (jobId) {
    ids = [String(jobId)]; // 删除单条记录
  } else if (jobIds.value.length > 0) {
    ids = jobIds.value; // 删除多条记录
  } else {
    message.warning('请勾选删除项');
    return;
  }

  dialog.warning({
    title: '警告',
    content: '确定删除已选中的数据项',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      loading.value = true;
      deleteScheduledJobApi(ids)
        .then(() => {
          message.success('删除成功');
          resetQuery();
        })
        .finally(() => {
          loading.value = false;
        });
    }
  });
}

/**
 * 执行定时任务
 */
function executeJobs(jobId?: string) {
  let ids: string[];
  if (jobId) {
    ids = [String(jobId)]; // 执行单条记录
  } else if (jobIds.value.length > 0) {
    ids = jobIds.value; // 执行多条记录
  } else {
    message.warning('请勾选项');
    return;
  }

  if (ids.length > 0) {
    dialog.warning({
      title: '执行定时任务',
      content: '确定执行定时任务?',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        executeJobsApi(ids).then(() => {
          message.success('执行定时任务成功');
          resetQuery();
        });
      },
      onNegativeClick: () => {
        message.error('执行定时任务失败');
        resetQuery();
      }
    });
  }
}

/**
 * 暂停定时任务
 */
function pauseJobs(jobId?: string) {
  let ids: string[];
  if (jobId) {
    ids = [String(jobId)]; // 暂停单条记录
  } else if (jobIds.value.length > 0) {
    ids = jobIds.value; // 暂停多条记录
  } else {
    message.warning('请勾选项');
    return;
  }

  if (ids.length > 0) {
    dialog.warning({
      title: '暂停定时任务',
      content: '确定暂停定时任务?',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        pauseJobsApi(ids).then(() => {
          message.success('暂停停定时任务成功');
          resetQuery();
        });
      },
      onNegativeClick: () => {
        message.error('暂停停定时任务失败');
        resetQuery();
      }
    });
  }
}

function handleJobBeanName() {
  selectJobBeanNameListApi().then((data) => {
    jobClassNameOptions.value = data;
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

        <NFormItem>
          <NSelect
            v-model:value="queryParams.status"
            placeholder="定时任务状态"
            clearable
            style="width: 150px"
            @update:value="handleQuery()"
          >
            <NSelect.Option label="正常" value="1" />
            <NSelect.Option label="禁用" value="-1" />
          </NSelect>
        </NFormItem>

        <NFormItem>
          <NButton type="primary" @click="handleQuery">
            <template #icon>
              <NIcon><Icon icon="mdi:magnify" /></NIcon>
            </template>
            搜索
          </NButton>

          <NButton type="primary" @click="resetQuery">
            <template #icon>
              <NIcon><Icon icon="mdi:refresh" /></NIcon>
            </template>
            重置
          </NButton>

          <NButton
            type="primary"
            @click="openDialog()"
            v-access:code="['sys:scheduledJob:add']"
          >
            <template #icon>
              <NIcon><Icon icon="mdi:plus" /></NIcon>
            </template>
            新增
          </NButton>

          <NButton
            type="primary"
            v-access:code="['sys:scheduledJob:run']"
            @click="executeJobs()"
          >
            <template #icon>
              <NIcon><Icon icon="mdi:play" /></NIcon>
            </template>
            启用
          </NButton>

          <NButton
            type="error"
            v-access:code="['sys:scheduledJob:pause']"
            @click="pauseJobs()"
          >
            <template #icon>
              <NIcon><Icon icon="mdi:stop" /></NIcon>
            </template>
            暂停
          </NButton>

          <NButton
            type="error"
            v-access:code="['sys:scheduledJob:delete']"
            :disabled="jobIds.length === 0"
            @click="handleDelete()"
          >
            <template #icon>
              <NIcon><Icon icon="mdi:delete" /></NIcon>
            </template>
            删除
          </NButton>
        </NFormItem>
      </NForm>

      <NDataTable
        v-model:checked-row-keys="jobIds"
        :loading="loading"
        :data="scheduledJobList"
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
            title: '定时任务类',
            key: 'jobClass',
            width: 400,
            align: 'center'
          },
          {
            title: 'cron表达式',
            key: 'cronExpression',
            align: 'center'
          },
          {
            title: '任务状态',
            key: 'status',
            width: 120,
            align: 'center',
            render: (row) => {
              return row.status === 1 
                ? h(NTag, { type: 'success' }, { default: () => '正常' })
                : h(NTag, { type: 'info' }, { default: () => '暂停' });
            }
          },
          {
            title: '创建时间',
            key: 'createTime',
            align: 'center'
          },
          {
            title: '备注',
            key: 'remark',
            align: 'center'
          },
          {
            title: '操作',
            key: 'actions',
            width: 300,
            align: 'center',
            render: (row) => {
              return h(NSpace, null, {
                default: () => [
                  h(NButton, {
                    type: 'primary',
                    size: 'small',
                    quaternary: true,
                    onClick: () => openDialog(row.jobId)
                  }, { default: () => '编辑' }),
                  h(NButton, {
                    type: 'primary',
                    size: 'small',
                    quaternary: true,
                    onClick: () => executeJobs(row.jobId)
                  }, { default: () => '启用' }),
                  h(NButton, {
                    type: 'error',
                    size: 'small',
                    quaternary: true,
                    onClick: () => pauseJobs(row.jobId)
                  }, { default: () => '暂停' }),
                  h(NButton, {
                    type: 'error',
                    size: 'small',
                    quaternary: true,
                    onClick: () => handleDelete(row.jobId)
                  }, { default: () => '删除' })
                ]
              });
            }
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

    <!-- 表单弹窗 -->
    <ScheduledJobFormDialog ref="scheduledJobDialogRef" @success="resetQuery" />
  </div>
</template>