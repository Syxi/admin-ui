<script setup lang="ts">
import type { DictTypePage, DictTypeQuery } from '#/api/system/sys/dictType';

import { onMounted, reactive, ref } from 'vue';

import { useMessage, NForm, NFormItem, NInput, NButton, NDataTable, NTag, NPagination, useDialog } from 'naive-ui';

import { h } from 'vue';

// 消息提示
const message = useMessage();

// 对话框
const dialog = useDialog();

import {
  deleteDictTypeApi,
  selectDictTypePageApi,
} from '#/api/system/sys/dictType';
import { useCardHeight } from '#/hooks/useCardHeight';
import DictFormDialog from '#/views/system/sys/dict/DictFormDialog.vue';
import DictValue from '#/views/system/sys/dict/DictValue.vue';
import {useTableHeight} from "#/hooks/useTableHeight";

defineOptions({
  name: 'DictType',
  inheritAttrs: false,
});

const queryFormRef = ref();

const loading = ref(false);

const ids = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<DictTypeQuery>({
  page: 1,
  limit: 20,
});

const dictTypeTableData = ref<DictTypePage[]>();

// 字典表单子组件
const dictFormDialogRef = ref();
function openDialog(id?: string) {
  dictFormDialogRef.value.openDialog(id);
}

// 查询
function handleQuery() {
  loading.value = true;
  selectDictTypePageApi(queryParams)
    .then((data) => {
      dictTypeTableData.value = data.list;
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
 * 行复选框选中
 * @param selection
 */
function handleSelectionChange(selection: any) {
  ids.value = selection.map((item: any) => item.id);
}

function handleDelete(dictTypeId?: string) {
  let dictTypeIds: string[];
  if (dictTypeId) {
    dictTypeIds = [String(dictTypeId)]; // 删除单条记录
  } else if (ids.value.length > 0) {
    dictTypeIds = ids.value; // 删除多条记录
  } else {
    message.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  dialog.warning({
    title: '警告',
    content: '确定删除已选中的数据项?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      deleteDictTypeApi(dictTypeIds).then(() => {
        message.success('删除成功');
        resetQuery();
      });
    }
  });
}

/**
 * 字典项弹窗
 */
const dictValueDialog = reactive({
  title: '',
  visible: false,
});

/**
 * 当前选中的字典类型
 */
const selectDictType = reactive({
  typeCode: '',
  typeName: '',
});

/**
 * 打开字典项弹窗
 * @param row
 */
function openDictValueDialog(row: DictTypePage) {
  dictValueDialog.visible = true;
  dictValueDialog.title = `【${row.name}】字典数据`;
  selectDictType.typeCode = row.typeCode;
  selectDictType.typeName = row.name;
}

/**
 * 关闭字典项弹窗
 */
function closeDictValueDialog() {
  dictValueDialog.visible = false;
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
      >
        <NFormItem prop="dictTypeName">
          <NInput
            v-model:value="queryParams.dictTypeName"
            placeholder="字典类型名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery()"
          />
        </NFormItem>

        <NFormItem prop="dictTypeCode">
          <NInput
            v-model:value="queryParams.dictTypeCode"
            placeholder="字典类型编码"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery()"
          />
        </NFormItem>

        <NFormItem>
          <NButton type="primary" @click="handleQuery()">
            搜索
          </NButton>

          <NButton type="primary" @click="resetQuery()">
            重置
          </NButton>

          <NButton
            type="primary"
            @click="openDialog()"
            v-access:code="['sys:dictType:add']"
          >
            新增
          </NButton>

          <NButton
            type="error"
            @click="handleDelete()"
            v-access:code="['sys:dictType:delete']"
          >
            删除
          </NButton>
        </NFormItem>
      </NForm>

      <NDataTable
        :loading="loading"
        :data="dictTypeTableData"
        :columns="[
          {
            type: 'selection',
            width: 55,
            align: 'center'
          },
          {
            title: '字典类型名称',
            key: 'name',
            width: 200,
            align: 'center'
          },
          {
            title: '字典类型编码',
            key: 'typeCode',
            width: 200,
            align: 'center'
          },
          {
            title: '状态',
            key: 'status',
            width: 100,
            align: 'center',
            render: (row) => {
              return row.status === 1
                ? h(NTag, { type: 'success' }, { default: () => '启用' })
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
            title: '备注',
            key: 'remark'
          },
          {
            title: '操作',
            key: 'actions',
            width: 300,
            align: 'center',
            fixed: 'right',
            render: (row) => [
              h(NButton,
                {
                  type: 'primary',
                  size: 'small',
                  text: true,
                  onClick: () => openDictValueDialog(row)
                },
                { default: () => '字典数据' }
              ),
              h('span', { style: 'margin: 0 8px;' }, '|'),
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
        @update:checked-row-keys="handleSelectionChange"
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

    <DictFormDialog ref="dictFormDialogRef" @success="resetQuery" />

    <!-- 字典项弹窗  -->
    <NModal
      v-model:show="dictValueDialog.visible"
      :title="dictValueDialog.title"
      :show-icon="false"
      preset="dialog"
      style="width: 1000px;"
      @close="closeDictValueDialog()"
    >
      <DictValue
        v-model:type-code="selectDictType.typeCode"
        v-model:type-name="selectDictType.typeName"
      />
    </NModal>
  </div>
</template>
