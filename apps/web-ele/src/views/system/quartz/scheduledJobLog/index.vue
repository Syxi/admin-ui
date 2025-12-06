<script setup lang="ts">
import type {
  ScheduledJobLogPage,
  ScheduledJobLogQuery,
} from '#/api/system/log/scheduledJobLog';

import { onMounted, reactive, ref } from 'vue';

import { ElForm } from 'element-plus';

import { selectJobBeanNameListApi } from '#/api/system/log/scheduledJob';
import { selectScheduledJobLogPageApi } from '#/api/system/log/scheduledJobLog';
import { useCardHeight } from '#/hooks/useCardHeight';
import {useTableHeight} from "#/hooks/useTableHeight";

defineOptions({
  name: 'ScheduledJobLog',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

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
  queryFormRef.value.resetFields();
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
      <ElForm ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item prop="jobName">
          <el-input
            v-model="queryParams.jobName"
            placeholder="定时任务名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item prop="beanName">
          <el-select
            v-model="queryParams.beanName"
            placeholder="定时任务beanName"
            clearable
            style="width: 240px"
            @change="handleQuery"
          >
            <el-option
              v-for="item in beanNameOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-select
            v-model="queryParams.status"
            placeholder="定时任务状态"
            clearable
            class="!w-[140px]"
            @change="handleQuery()"
          >
            <el-option label="正常" value="1" />
            <el-option label="禁用" value="-1" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <template #icon>
              <el-icon><Search /></el-icon>
            </template>
            搜索
          </el-button>

          <el-button type="primary" @click="resetQuery">
            <template #icon>
              <el-icon><Refresh /></el-icon>
            </template>
            重置
          </el-button>
        </el-form-item>
      </ElForm>

      <el-table
        v-loading="loading"
        :data="jobLogList"
        highlight-current-row
        border
        :height="tableHeight"
      >
        <el-table-column type="selection" width="80" align="center" />

        <el-table-column v-if="false" prop="id" width="200" />

        <el-table-column label="定时任务名称" prop="jobName" align="center" />

        <el-table-column
          label="定时任务Bean"
          prop="beanName"
          width="500"
          align="center"
        />

        <!-- <el-table-column
          label="cron表达式"
          prop="cronExpression"
          align="center"
        /> -->

        <el-table-column label="状态" prop="status" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="info">暂停</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="耗时（毫秒）"
          prop="executeTime"
          align="center"
        />

        <el-table-column label="执行时间" prop="startTime" align="center" />
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :total="total"
        :page-sizes="[10, 20, 30, 40, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
      />
  </div>
</template>
