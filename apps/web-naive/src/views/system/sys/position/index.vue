<script setup lang="ts">
import type { PositionQuery, PositionVO } from '#/api/system/sys/position';

import { h, onMounted, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NButton, NDataTable, NPagination, NIcon, NSpace, NTag } from 'naive-ui';
import { message, dialog } from '#/hooks';

import { deptOptionTreeApi } from '#/api/system/sys/dept';
import {
  deletePositionApi,
  selectPositionPageApi,
} from '#/api/system/sys/position';
import { useCardHeight } from '#/hooks/useCardHeight';
import PositionFormDialog from '#/views/system/sys/position/PositionFormDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";
import { Search, Refresh, Plus, Delete, Edit } from '@vben/icons';

defineOptions({
  name: 'Position',
  inheritAttrs: false,
});

const queryFormRef = ref();

const loading = ref(false);

const positionIds = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<PositionQuery>({
  page: 1,
  limit: 20,
});

const positionTableData = ref<PositionVO[]>();

// 组织下拉选项树数据
const deptTreeOptionData = ref<OptionType[]>([]);


/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  // 多选
  positionIds.value = selection.map((item: any) => item.positionId);
}

// 新增、编辑弹窗子组件
const formDialogRef = ref();
function openDialog(positionId?: string) {
  formDialogRef.value.openDialog(positionId, deptTreeOptionData.value);
}

/**
 * 查询
 */
function handleQuery() {
  loading.value = true;
  selectPositionPageApi(queryParams)
    .then((data) => {
      positionTableData.value = data.list;
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
  queryFormRef.value?.restoreValidation();
  queryParams.page = 1;
  handleQuery();
}

/**
 * 删除岗位
 * @param positionId
 */
function handleDelete(positionId?: string) {
  let ids: string[];
  if (positionId) {
    ids = [String(positionId)]; // 删除单条记录
  } else if (positionIds.value.length > 0) {
    ids = positionIds.value; // 删除多条记录
  } else {
    message.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  dialog.warning({
    title: '警告',
    content: '确定删除已选中的数据项',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      loading.value = true;
      deletePositionApi(ids)
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

// 获取部门下拉选项
async function deptTreeOptions() {
  deptTreeOptionData.value = await deptOptionTreeApi();
}

onMounted(() => {
  handleQuery();
  deptTreeOptions();
});

const { tableHeight } = useTableHeight(queryFormRef);
</script>

<template>
  <div class="app-container">
      <NForm
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        @submit.prevent="handleQuery()"
      >
        <NFormItem prop="positionName">
          <NInput
            v-model:value="queryParams.positionName"
            placeholder="请输入岗位名称"
            clearable
            style="width: 240px"
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

          <NButton
            type="primary"
            v-access:code="['sys:position:add']"
            @click="openDialog()"
          >
            <template #icon>
              <NIcon><Plus /></NIcon>
            </template>
            新增
          </NButton>

          <NButton
            type="error"
            :disabled="positionIds.length === 0"
            v-access:code="['sys:position:delete']"
            @click="handleDelete()"
          >
            <template #icon>
              <NIcon><Delete /></NIcon>
            </template>
            删除
          </NButton>
        </NFormItem>
      </NForm>

      <NDataTable
        v-model:checked-row-keys="positionIds"
        :loading="loading"
        :data="positionTableData"
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
            title: '岗位名称',
            key: 'positionName',
            width: 200,
            align: 'center'
          },
          {
            title: '所属部门',
            key: 'deptName',
            width: 200,
            align: 'center'
          },
          {
            title: '状态',
            key: 'status',
            width: 120,
            align: 'center',
            render: (row) => {
              return row.status === 1 
                ? h(NTag, { type: 'success' }, { default: () => '正常' })
                : h(NTag, { type: 'info' }, { default: () => '禁用' });
            }
          },
          {
            title: '排序',
            key: 'sort',
            width: 100,
            align: 'center'
          },
          {
            title: '创建时间',
            key: 'createTime',
            width: 250,
            align: 'center'
          },
          {
            title: '更新时间',
            key: 'updateTime',
            width: 250,
            align: 'center'
          },
          {
            title: '操作',
            key: 'actions',
            align: 'center',
            width: 200,
            render: (row) => {
              return h(NSpace, null, {
                default: () => [
                  h(NButton, {
                    type: 'primary',
                    size: 'small',
                    quaternary: true,
                    onClick: () => openDialog(row.positionId)
                  }, { default: () => '编辑' }),
                  h(NButton, {
                    type: 'error',
                    size: 'small',
                    quaternary: true,
                    onClick: () => handleDelete(row.positionId)
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
    <PositionFormDialog ref="formDialogRef" @success="resetQuery" />
  </div>
</template>