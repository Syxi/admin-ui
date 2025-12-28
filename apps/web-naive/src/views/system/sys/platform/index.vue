<script setup lang="ts">
import type { PlatformQuery, PlatformVO } from '#/api/system/sys/platform';

import { onMounted, reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { useMessage, NForm, NFormItem, NInput, NButton, NDataTable, NTag, NPagination, useDialog } from 'naive-ui';

import { h } from 'vue';

// 消息提示
const message = useMessage();

// 对话框
const dialog = useDialog();

import { deletePlatformApi, selectPageApi } from '#/api/system/sys/platform';
import { useCardHeight } from '#/hooks/useCardHeight';
import PlatformFormDialog from '#/views/system/sys/platform/platformFormDialog.vue';

const queryFormRef = ref();

const loading = ref(false);

const queryParams = reactive<PlatformQuery>({
  page: 1,
  limit: 20,
});

const total = ref(0);

const platformTableData = ref<PlatformVO[]>([]);

const dataTableRef = ref();

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
  dialog.warning({
    title: '警告',
    content: '确定删除已选中的数据?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      loading.value = true;
      deletePlatformApi(id)
        .then(() => {
          message.success('删除成功');
          resetQuery();
        })
        .finally(() => {
          loading.value = false;
        });
    }
  });
};

const cardFormRef = ref();
const { cardHeight, tableHeight } = useCardHeight(cardFormRef);

onMounted(() => {
  handleQuery();
});
</script>
<template>
  <div class="app-container">
    <NCard ref="cardFormRef" class="mb-2" :bordered="false">
      <NForm
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        @submit.prevent
      >
        <NFormItem prop="name">
          <NInput
            v-model:value="queryParams.name"
            placeholder="平台名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </NFormItem>

        <NFormItem>
          <NButton type="primary" @click="handleQuery">
            搜索
          </NButton>

          <NButton type="primary" @click="resetQuery">
            重置
          </NButton>

          <NButton
            type="primary"
            v-access:code="['sys:platform:add']"
            @click="openDialog()"
          >
            新增
          </NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard :style="{ height: cardHeight }" :bordered="false">
      <NDataTable
        ref="dataTableRef"
        :loading="loading"
        :data="platformTableData"
        :columns="[
          {
            type: 'selection',
            width: 80,
            align: 'center'
          },
          {
            title: '序号',
            key: 'index',
            width: 80,
            align: 'center',
            render: (row, index) => index + 1
          },
          {
            title: '平台名称',
            key: 'name',
            align: 'center',
            width: 200
          },
          {
            title: '平台路径',
            key: 'path',
            align: 'center',
            width: 200
          },
          {
            title: '平台icon',
            key: 'icon',
            align: 'center',
            width: 200,
            render: (row) => h('span', { class: 'icon-container' }, [h(Icon, { icon: row.icon })])
          },
          {
            title: '状态',
            key: 'status',
            align: 'center',
            width: 120,
            render: (row) => {
              return row.status === 1
                ? h(NTag, { type: 'success' }, { default: () => '正常' })
                : h(NTag, { type: 'info' }, { default: () => '禁用' });
            }
          },
          {
            title: '排序',
            key: 'sort',
            align: 'center',
            width: 100
          },
          {
            title: '创建时间',
            key: 'createTime',
            align: 'center',
            width: 200
          },
          {
            title: '更新时间',
            key: 'updateTime',
            align: 'center',
            width: 200
          },
          {
            title: '备注',
            key: 'remark',
            align: 'center',
            width: 200
          },
          {
            title: '操作',
            key: 'actions',
            align: 'center',
            width: 150,
            render: (row) => [
              h(NButton,
                {
                  type: 'primary',
                  size: 'small',
                  text: true,
                  onClick: () => openDialog(row.id)
                },
                { default: () => '编辑' }
              ),
              h('span', { style: 'margin: 0 8px;' }, '|'),
              h(NButton,
                {
                  type: 'primary',
                  size: 'small',
                  text: true,
                  onClick: () => handleDelete(row.id)
                },
                { default: () => '删除' }
              )
            ]
          }
        ]"
        :row-key="(row) => row.id"
        :scroll-x="1200"
        :virtual-scroll="false"
        :pagination="false"
        :height="tableHeight"
      />

      <NPagination
        v-if="total > 0"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :page-count="Math.ceil(total / queryParams.limit)"
        :page-sizes="[10, 20, 30, 40, 50, 100]"
        :show-size-picker="true"
        @update:page="handleQuery"
        @update:page-size="handleQuery"
        @update:page-count="handleQuery"
      />
    </NCard>

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
