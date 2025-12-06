<script setup lang="ts">
import type {
  SwitchConfigForm,
  SwitchConfigPage,
  SwitchConfigQuery,
} from '#/api/system/tool/switchConfig';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage } from 'element-plus';

import {
  getSwitchConfigApi,
  selectSwitchConfigPageApi,
  updateStatusApi,
  updateSwitchConfigApi,
} from '#/api/system/tool/switchConfig';
import { useCardHeight } from '#/hooks/useCardHeight';
import {useTableHeight} from "#/hooks/useTableHeight";

defineOptions({
  name: 'SwitchConfig',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const configFormRef = ref(ElForm);

const loading = ref(false);

const total = ref(0);

const queryParams = reactive<SwitchConfigQuery>({
  configName: '',
  page: 1,
  limit: 20,
});

const tableData = ref<SwitchConfigPage[]>();

const dialog = reactive({
  title: '',
  visible: false,
});

const formData = reactive<SwitchConfigForm>({
  configName: '',
  remark: '',
});

function handleQuery() {
  loading.value = true;
  selectSwitchConfigPageApi(queryParams)
    .then((data) => {
      tableData.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

function resetQuery() {
  queryParams.configName = '';
  handleQuery();
}

function handleStatusChange(row: SwitchConfigPage) {
  const id = row.id;
  const configValue = row.configValue;
  const configKey = row.configKey;
  updateStatusApi(id, configKey, configValue)
    .then(() => {
      if (configValue) {
        ElMessage.success('开关开启');
      } else {
        ElMessage.success('开关关闭');
      }

      handleQuery();
    })
    .catch(() => {
      row.configValue = !row.configValue;
    });
}

function openDialog(id: string) {
  dialog.title = '编辑配置';
  dialog.visible = true;
  getSwitchConfigApi(id).then((response) => {
    const data = response;
    Object.assign(formData, data);
  });
}

function closeDialog() {
  dialog.visible = false;
}

function handleSubmit() {
  if (configFormRef.value.validate()) {
    updateSwitchConfigApi(formData)
      .then(() => {
        ElMessage.success('修改成功!');
        handleQuery();
        closeDialog();
      })
      .catch(() => {
        console.log('提交失败');
      });
  }
}

onMounted(() => {
  handleQuery();
});

const { tableHeight } = useTableHeight(queryFormRef);
</script>

<template>
  <div class="app-container">
      <ElForm
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        @submit.prevent
      >
        <el-form-item prop="configName">
          <el-input
            v-model="queryParams.configName"
            placeholder="配置名称"
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
        </el-form-item>
      </ElForm>

      <el-table
        ref="dataTableRef"
        v-loading="loading"
        :data="tableData"
        highlight-current-row
        border
        :height="tableHeight"
      >
        <el-table-column type="selection" width="80" align="center" />

        <el-table-column
          v-if="false"
          key="id"
          label="编号"
          prop="id"
          width="100"
        />

        <el-table-column label="配置名称" prop="configName" width="200" />

        <el-table-column label="开关" prop="configValue" width="150">
          <template #default="scope">
            <el-switch
              v-model="scope.row.configValue"
              size="large"
              @click="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="备注" prop="remark" align="center" />

        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              @click="openDialog(scope.row.id)"
            >
              <el-icon><Edit /></el-icon>编辑
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

    <el-dialog
      center
      draggable
      v-model="dialog.visible"
      :title="dialog.title"
      width="500px"
      @close="closeDialog"
    >
      <ElForm
        ref="configFormRef"
        :model="formData"
        label-width="100px"
        style="max-width: 400px"
      >
        <el-form-item label="配置名称" prop="configName">
          <el-input
            v-model="formData.configName"
            placeholder="请输入配置名称"
          />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            type="textarea"
            v-model="formData.remark"
            placeholder="请输入备注"
          />
        </el-form-item>
      </ElForm>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
