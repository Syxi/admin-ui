<script setup lang="ts">
import type {
  OnlineUserQuery,
  OnlineUserVO,
} from '#/api/system/sys/onlineUser';

import { onMounted, reactive, ref } from 'vue';

import { Delete } from '@element-plus/icons-vue';
import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  kickoutUserApi,
  selectOnlineUserPageApi,
} from '#/api/system/sys/onlineUser';
import {useTableHeight} from "#/hooks/useTableHeight";

const queryFormRef = ref(ElForm);
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
//   ElMessageBox.confirm('确定要强制下线吗？', '提示', {
//     confirmButtonText: '确定',
//     cancelButtonText: '取消',
//     type: 'warning',
//   })
//     .then(() => {
//       kickoutUserApi(username).then(() => {
//         ElMessage.success('强制下线成功！');
//         resetQuery();
//       });
//     })
//     .catch(() => {
//       ElMessage.error('强制下线失败！');
//     });
// }

onMounted(() => {
  handleQuery();
});

const { tableHeight } = useTableHeight(queryFormRef);
</script>

<template>
  <div class="app-container">
      <ElForm
        ref="queryFormRef"
        :model="queryFormParams"
        :inline="true"
        @submit.prevent
      >
        <el-form-item prop="username">
          <el-input
            placeholder="用户名"
            v-model="queryFormParams.username"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery()"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery()">
            查询
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="resetQuery()">重置</el-button>
        </el-form-item>
      </ElForm>
      <el-table
        :data="onlineUserData"
        v-loading="loading"
        border
        :height="tableHeight"
      >
        <el-table-column label="用户名" prop="username" />
        <el-table-column label="登录时间" prop="loginTime" />
<!--        <el-table-column label="操作">-->
<!--          <template #default="scope">-->
<!--            <el-button-->
<!--              type="danger"-->
<!--              size="small"-->
<!--              link-->
<!--              @click="kickoutUser(scope.row.username)"-->
<!--            >-->
<!--              <el-icon><Delete /></el-icon>强制下线-->
<!--            </el-button>-->
<!--          </template>-->
<!--        </el-table-column>-->
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="queryFormParams.page"
        v-model:page-size="queryFormParams.limit"
        :total="total"
        :page-sizes="[10, 20, 30, 40, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
      />
  </div>
</template>
