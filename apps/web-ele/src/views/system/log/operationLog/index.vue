<script setup lang="ts">
import type { OperationLog, OperationLogQuery } from '#/api/system/log/log';

import { onMounted, reactive, ref } from 'vue';

import { selectOperationLogPageApi } from '#/api/system/log/log';
import {useCardHeight} from "#/hooks/useCardHeight";
import {useTableHeight} from "#/hooks/useTableHeight";

const queryFormRef = ref();

const queryParams = reactive<OperationLogQuery>({
  page: 1,
  limit: 20,
});

const loading = ref(false);

const total = ref(0);

const operationLogData = ref<OperationLog[]>([]);

/**
 * 查询用户操作日志
 */
function handleQuery() {
  loading.value = true;
  selectOperationLogPageApi(queryParams)
    .then((data) => {
      operationLogData.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 重置查询
function resetQuery() {
  queryFormRef.value.resetFields();

  handleQuery();
}

onMounted(() => {
  handleQuery();
});

const { tableHeight } = useTableHeight(queryFormRef);
</script>

<template>
  <div class="app-container">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" @submit.prevent>
        <el-form-item prop="username">
          <el-input
            v-model="queryParams.username"
            style="width: 240px"
            placeholder="请输入用户名"
            @keyup.enter="handleQuery()"
          />
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
      </el-form>

      <el-table
        :data="operationLogData"
        :loading="loading"
        highlight-current-row
        :height="tableHeight"
      >
        <el-table-column type="index" label="序号" align="center" />

        <!-- <el-table-column
          v-if="false"
          prop="id"
        /> -->
        <el-table-column prop="username" label="用户名" align="center" />

        <el-table-column prop="operation" label="用户操作" align="center" />

        <el-table-column
          prop="method"
          label="请求方法"
          align="center"
          width="700"
        />

        <!-- <el-table-column
          prop="params"
          label="请求参数"
          align="center"
        /> -->

        <el-table-column prop="ip" label="ip" align="center" />

        <el-table-column prop="address" label="ip地址" align="center" />

        <el-table-column prop="createTime" label="操作时间" align="center" />
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
