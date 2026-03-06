<script setup lang="ts">
import type { PlatformQuery, PlatformVO } from '#/api/system/sys/platform';

import { onMounted, reactive, ref } from 'vue';

import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue';
import { Icon } from '@iconify/vue';
import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import { deletePlatformApi, selectPageApi } from '#/api/system/sys/platform';
import { useTableHeight } from '#/hooks/useTableHeight';
import PlatformFormDialog from '#/views/system/sys/platform/platformFormDialog.vue';

const queryFormRef = ref(ElForm);

const loading = ref(false);

const queryParams = reactive<PlatformQuery>({
  page: 1,
  limit: 20,
});

const total = ref(0);

const platformTableData = ref<PlatformVO[]>([]);

const dataTableRef = ref(ElForm);

const platformDialogRef = ref();

function openDialog(id?: string) {
  platformDialogRef.value.open(id);
}

const handleQuery = () => {
  loading.value = true;
  selectPageApi(queryParams)
    .then((data) => {
      platformTableData.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
};

const resetQuery = () => {
  queryFormRef.value.resetFields();
  queryParams.page = 1;
  handleQuery();
};

const handleDelete = (id: string) => {
  ElMessageBox.confirm('确定删除已选中的数据', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    loading.value = true;
    deletePlatformApi(id)
      .then(() => {
        ElMessage.success('删除成功');
        resetQuery();
      })
      .finally(() => {
        loading.value = false;
      });
  });
};

const { tableHeight } = useTableHeight(queryFormRef);

onMounted(() => {
  handleQuery();
});
</script>
<template>
  <div class="app-container">
    <el-card ref="cardFormRef" class="mb-2" shadow="never">
      <ElForm
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        @submit.prevent
      >
        <el-form-item prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="平台名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
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

          <el-button
            type="primary"
            v-access:code="['sys:platform:add']"
            @click="openDialog()"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>
        </el-form-item>
      </ElForm>
    </el-card>

    <el-card shadow="never">
      <el-table
        ref="dataTableRef"
        v-loading="loading"
        :data="platformTableData"
        highlight-current-row
        :border="true"
        :height="tableHeight"
      >
        <el-table-column type="selection" width="80" align="center" />
        <el-table-column type="index" width="80" align="center" label="序号" />

        <el-table-column
          label="平台名称"
          prop="name"
          width="200"
          align="center"
        />

        <el-table-column
          label="平台路径"
          prop="path"
          width="200"
          align="center"
        />

        <el-table-column
          label="平台icon"
          prop="icon"
          width="200"
          align="center"
        >
          <template #default="scope">
            <span class="icon-container">
              <Icon :icon="scope.row.icon" />
            </span>
          </template>
        </el-table-column>

        <el-table-column label="状态" prop="status" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序" prop="sort" width="100" align="center" />

        <el-table-column
          label="创建时间"
          prop="createTime"
          width="200"
          align="center"
        />

        <el-table-column
          label="更新时间"
          prop="updateTime"
          width="200"
          align="center"
        />

        <el-table-column
          label="备注"
          prop="remark"
          width="200"
          align="center"
        />

        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:platform:update']"
              @click="openDialog(scope.row.id)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:platform:delete']"
              @click="handleDelete(scope.row.id)"
            >
              <el-icon><Delete /></el-icon>删除
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
    </el-card>

    <PlatformFormDialog ref="platformDialogRef" @success="handleQuery" />
  </div>
</template>

<style scoped lang="scss">
.icon-container {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
</style>
