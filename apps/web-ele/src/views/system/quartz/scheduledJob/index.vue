<script setup lang="ts">
import type {
  ScheduledJobPage,
  ScheduledJobQuery,
} from '#/api/system/log/scheduledJob';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

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

defineOptions({
  name: 'ScheduledJob',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

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
    ElMessage.warning('请勾选删除项');
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据项', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    loading.value = true;
    deleteScheduledJobApi(ids)
      .then(() => {
        ElMessage.success('删除成功');
        resetQuery();
      })
      .finally(() => {
        loading.value = false;
      });
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
    ElMessage.warning('请勾选项');
    return;
  }

  if (ids.length > 0) {
    ElMessageBox.confirm('确定执行定时任务?', '执行定时任务', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success',
    })
      .then(() => {
        executeJobsApi(ids).then(() => {
          ElMessage.success('执行定时任务成功');
          resetQuery();
        });
      })
      .catch(() => {
        ElMessage.error('执行定时任务失败');
        resetQuery();
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
    ElMessage.warning('请勾选项');
    return;
  }

  if (ids.length > 0) {
    ElMessageBox.confirm('确定暂停定时任务?', '暂停定时任务', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        pauseJobsApi(ids).then(() => {
          ElMessage.success('暂停停定时任务成功');
          resetQuery();
        });
      })
      .catch(() => {
        ElMessage.error('暂停停定时任务失败');
        resetQuery();
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

        <el-form-item>
          <el-select
            v-model="queryParams.status"
            placeholder="定时任务状态"
            clearable
            style="width: 150px"
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

          <el-button
            type="primary"
            @click="openDialog()"
            v-access:code="['sys:scheduledJob:add']"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:scheduledJob:run']"
            @click="executeJobs()"
          >
            <template #icon>
              <el-icon><VideoPlay /></el-icon>
            </template>
            启用
          </el-button>

          <el-button
            type="danger"
            v-access:code="['sys:scheduledJob:pause']"
            @click="pauseJobs()"
          >
            <template #icon>
              <el-icon><VideoPlay /></el-icon>
            </template>
            暂停
          </el-button>

          <el-button
            type="danger"
            v-access:code="['sys:scheduledJob:delete']"
            :disabled="jobIds.length === 0"
            @click="handleDelete()"
          >
            <template #icon>
              <el-icon><Delete /></el-icon>
            </template>
            删除
          </el-button>
        </el-form-item>
      </ElForm>

      <el-table
        v-loading="loading"
        :data="scheduledJobList"
        highlight-current-row
        border
        :height="tableHeight"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="80" align="center" />

        <el-table-column v-if="false" prop="jobId" />

        <el-table-column label="定时任务名称" prop="jobName" align="center" />

        <el-table-column
          label="定时任务类"
          prop="jobClass"
          width="400"
          align="center"
        />

        <el-table-column
          label="cron表达式"
          prop="cronExpression"
          align="center"
        />

        <el-table-column
          label="任务状态"
          prop="status"
          width="120"
          align="center"
        >
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="info">暂停</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" prop="createTime" align="center" />

        <el-table-column label="备注" prop="remark" align="center" />

        <el-table-column label="操作" width="300" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              v-access:code="['sys:scheduledJob:edit']"
              @click="openDialog(scope.row.jobId)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              type="primary"
              link
              size="small"
              v-access:code="['sys:scheduledJob:run']"
              @click="executeJobs(scope.row.jobId)"
            >
              <el-icon><VideoPlay /></el-icon>启用
            </el-button>

            <el-button
              type="danger"
              link
              size="small"
              v-access:code="['sys:scheduledJob:pause']"
              @click="pauseJobs(scope.row.jobId)"
            >
              <el-icon><CircleClose /></el-icon>暂停
            </el-button>

            <el-button
              type="danger"
              link
              size="small"
              v-access:code="['sys:scheduledJob:delete']"
              @click="handleDelete(scope.row.jobId)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
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

    <!-- 表单弹窗 -->
    <ScheduledJobFormDialog ref="scheduledJobDialogRef" @success="resetQuery" />
  </div>
</template>
