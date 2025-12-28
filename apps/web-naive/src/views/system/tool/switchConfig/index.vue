<script setup lang="ts">
import type {
  SwitchConfigForm,
  SwitchConfigPage,
  SwitchConfigQuery,
} from '#/api/system/tool/switchConfig';

import { h, onMounted, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NButton, NDataTable, NPagination, NIcon, NSpace, NSwitch, NModal } from 'naive-ui';
import { message } from '#/hooks';

import {
  getSwitchConfigApi,
  selectSwitchConfigPageApi,
  updateStatusApi,
  updateSwitchConfigApi,
} from '#/api/system/tool/switchConfig';
import { useCardHeight } from '#/hooks/useCardHeight';
import {useTableHeight} from "#/hooks/useTableHeight";
import { Search, Refresh, Edit } from '@vben/icons';

defineOptions({
  name: 'SwitchConfig',
  inheritAttrs: false,
});

const queryFormRef = ref();

const configFormRef = ref();

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
        message.success('开关开启');
      } else {
        message.success('开关关闭');
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

async function handleSubmit() {
  try {
    await configFormRef.value?.validate();
    await updateSwitchConfigApi(formData);
    message.success('修改成功!');
    handleQuery();
    closeDialog();
  } catch (error) {
    console.log('提交失败');
  }
}

onMounted(() => {
  handleQuery();
});

const { tableHeight } = useTableHeight(queryFormRef);
</script>

<template>
  <div class="app-container">
      <NForm
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        @submit.prevent
      >
        <NFormItem prop="configName">
          <NInput
            v-model:value="queryParams.configName"
            placeholder="配置名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
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
        :data="tableData"
        :columns="[
          {
            type: 'selection',
            width: 80,
            align: 'center'
          },
          {
            title: '配置名称',
            key: 'configName',
            width: 200
          },
          {
            title: '开关',
            key: 'configValue',
            width: 150,
            render: (row) => h(NSwitch, {
              value: row.configValue,
              size: 'large',
              onUpdateValue: () => handleStatusChange(row)
            })
          },
          {
            title: '备注',
            key: 'remark',
            align: 'center'
          },
          {
            title: '操作',
            key: 'actions',
            align: 'center',
            render: (row) => {
              return h(NSpace, null, {
                default: () => [
                  h(NButton, {
                    type: 'primary',
                    size: 'small',
                    quaternary: true,
                    onClick: () => openDialog(row.id)
                  }, { default: () => '编辑' })
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

    <NModal
      v-model:show="dialog.visible"
      :title="dialog.title"
      :show-icon="false"
      preset="dialog"
      style="width: 500px;"
      @close="closeDialog"
    >
      <NForm
        ref="configFormRef"
        :model="formData"
        label-width="100px"
        style="max-width: 400px"
      >
        <NFormItem label="配置名称" path="configName">
          <NInput
            v-model:value="formData.configName"
            placeholder="请输入配置名称"
          />
        </NFormItem>

        <NFormItem label="备注" path="remark">
          <NInput
            type="textarea"
            v-model:value="formData.remark"
            placeholder="请输入备注"
          />
        </NFormItem>
      </NForm>

      <template #action>
        <div class="dialog-footer">
          <NButton @click="closeDialog">取消</NButton>
          <NButton type="primary" @click="handleSubmit">确定</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>