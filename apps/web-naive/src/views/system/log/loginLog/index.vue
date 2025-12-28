<script setup lang="ts">
import type { LoginLog, LoginLogQuery } from '#/api/system/log/log';

import { onMounted, reactive, ref } from 'vue';

import { selectLoginLogPageApi } from '#/api/system/log/log';
import { useCardHeight } from '#/hooks/useCardHeight';
import {useTableHeight} from "#/hooks/useTableHeight";

const queryFormRef = ref();

const queryParams = reactive<LoginLogQuery>({
  page: 1,
  limit: 20,
});

const loading = ref(false);

const total = ref(0);

const loginLogData = ref<LoginLog[]>([]);

/**
 * 查询用户操作日志
 */
function handleQuery() {
  loading.value = true;
  selectLoginLogPageApi(queryParams)
    .then((data) => {
      loginLogData.value = data.list;
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
          <el-button type="primary" @click="handleQuery()">
            <template #icon>
              <el-icon><Search /></el-icon>
            </template>
            搜索
          </el-button>

          <el-button type="primary" @click="resetQuery()">
            <template #icon>
              <el-icon><Refresh /></el-icon>
            </template>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="loginLogData"
        :loading="loading"
        highlight-current-row
        :height="tableHeight"
      >
        <el-table-column type="index" label="序号" width="100" align="center" />

        <!-- <el-table-column
            v-if="false"
            prop="id"
          /> -->
        <el-table-column
          prop="username"
          label="用户名"
          align="center"
          width="220"
        />

        <el-table-column prop="ip" label="登录ip" align="center" />

        <el-table-column prop="address" label="登录地址" align="center" />

        <el-table-column prop="os" label="平台" align="center" />

        <el-table-column prop="browser" label="浏览器" align="center" />

        <el-table-column prop="loginTime" label="登录时间" align="center" />
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
