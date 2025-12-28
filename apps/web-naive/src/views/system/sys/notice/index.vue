<script setup lang="ts">
import type {
  NoticeQuery,
  NoticeVO,
} from '#/api/system/sys/notice';

import { onMounted, reactive, ref, h } from 'vue';

import { NButton, NPopconfirm, useMessage, useDialog, NTag, DataTableInst } from 'naive-ui';
import { ElForm } from 'element-plus';
import type { FormInst } from 'naive-ui';

import {
  cancelPublishNoticesApi,
  cancelTopNoticeApi,
  deleteNoticeApi,
  publishNoticesApi,
  selectNoticePageApi,
  topNoticeApi,
} from '#/api/system/sys/notice';
import NoticeFormDrawer from "#/views/system/sys/notice/NoticeFormDrawer.vue";

defineOptions({
  name: 'Notice',
  inheritAttrs: false,
});

const queryFormRef = ref<FormInst>();
const dataTableRef = ref<DataTableInst | null>(null);

const message = useMessage();
const dialog = useDialog();

const loading = ref(false);

const noticeIds = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<NoticeQuery>({
  noticeTitle: '',
  page: 1,
  limit: 20,
});

const noticeTableData = ref<NoticeVO[]>();

const columns = [
  {
    type: 'selection',
    align: 'center',
  },
  {
    title: '通知标题',
    key: 'noticeTitle',
    width: 200,
    align: 'center',
  },
  {
    title: '通知内容',
    key: 'noticeContent',
    width: 200,
    align: 'center',
  },
  {
    title: '置顶',
    key: 'isTop',
    width: 120,
    align: 'center',
    render: (row: any) => {
      return h(NTag, { type: row.isTop === 1 ? 'success' : 'info' }, { default: () => row.isTop === 1 ? '置顶' : '未置顶' });
    },
  },
  {
    title: '状态',
    key: 'isPublish',
    width: 120,
    align: 'center',
    render: (row: any) => {
      return h(NTag, { type: row.isPublish === 1 ? 'success' : 'info' }, { default: () => row.isPublish === 1 ? '发布' : '未发布' });
    },
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 250,
    align: 'center',
  },
  {
    title: '更新时间',
    key: 'updateTime',
    width: 250,
    align: 'center',
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    render: (row: any) => {
      return [
        h(
          NButton,
          {
            type: 'primary',
            size: 'small',
            quaternary: true,
            onClick: () => openDialog(row.noticeId),
            vAccess: { code: ['sys:notice:edit'] },
          },
          { default: () => '编辑' }
        ),
        h(
          NButton,
          {
            type: 'error',
            size: 'small',
            quaternary: true,
            onClick: () => handleDelete(row.noticeId),
            vAccess: { code: ['sys:notice:delete'] },
          },
          { default: () => '删除' }
        ),
      ];
    },
  },
];

// 通知表单子组件
const noticeFormDrawerRef = ref();
function openDialog(noticeId?: string) {
  noticeFormDrawerRef.value.openDialog(noticeId);
}

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  // 多选
  noticeIds.value = selection.map((item: any) => item.noticeId);
}

/**
 * 查询
 */
function handleQuery() {
  loading.value = true;
  selectNoticePageApi(queryParams)
    .then((data) => {
      noticeTableData.value = data.list;
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
  queryParams.noticeTitle = '';
  queryParams.page = 1;
  handleQuery();
}





/**
 * 删除岗位
 * @param noticeId
 */
function handleDelete(noticeId?: string) {
  let ids: string[];
  if (noticeId) {
    ids = [String(noticeId)]; // 删除单条记录
  } else if (noticeIds.value.length > 0) {
    ids = noticeIds.value; // 删除多条记录
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
      deleteNoticeApi(ids)
        .then(() => {
          message.success('删除成功');
          resetQuery();
        })
        .finally(() => {
          loading.value = false;
        });
    },
  });
}

/**
 * 置顶通知
 */
function handleTopNotice() {
  if (noticeIds.value.length === 0) {
    message.error('请勾选置顶项');
  } else if (noticeIds.value.length > 1) {
    message.error('不能置顶多条通知');
  } else {
    const noticeId = String(noticeIds.value[0]); // 勾选一条通知
    topNoticeApi(noticeId).then(() => {
      message.success('置顶通知成功');
      resetQuery();
    });
  }
}

/**
 *  取消置顶通知
 */
function handleCancelTopNotice() {
  if (noticeIds.value.length === 0) {
    message.error('请勾取消选置顶项');
  } else if (noticeIds.value.length > 1) {
    message.error('不能取消置顶多条通知');
  } else {
    const noticeId = String(noticeIds.value[0]); // 勾选一条通知
    cancelTopNoticeApi(noticeId).then(() => {
      message.success('取消置顶通知成功');
      resetQuery();
    });
  }
}

/**
 * 发布通知
 */
function publishNotices() {
  if (noticeIds.value.length === 0) {
    message.error('请勾选发布项');
  } else {
    publishNoticesApi(noticeIds.value).then(() => {
      message.success('发布通知成功');
      resetQuery();
    });
  }
}

/**
 * 取消发布通知
 */
function cancelPublishNotices() {
  if (noticeIds.value.length === 0) {
    message.error('请勾选发布项');
  } else {
    cancelPublishNoticesApi(noticeIds.value).then(() => {
      message.success('取消发布通知成功');
      resetQuery();
    });
  }
}

onMounted(() => {
  handleQuery();
});

const tableHeight = ref(400); // 临时设置表格高度，待后续实现useTableHeight hook
</script>

<template>
  <div class="app-container">
      <n-form ref="queryFormRef" :model="queryParams" :inline="true" @submit.prevent="handleQuery">
        <n-form-item prop="roleName">
          <n-input
            v-model:value="queryParams.noticeTitle"
            placeholder="通知标题"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </n-form-item>

        <n-form-item>
          <n-button attr-type="submit" type="primary" @click="handleQuery">
            <template #icon>
              <n-icon><Search /></n-icon>
            </template>
            搜索
          </n-button>

          <n-button type="primary" @click="resetQuery">
            <template #icon>
              <n-icon><Refresh /></n-icon>
            </template>
            重置
          </n-button>

          <n-button
            type="primary"
            v-access:code="['sys:notice:add']"
            @click="openDialog()"
          >
            <template #icon>
              <n-icon><Plus /></n-icon>
            </template>
            新增
          </n-button>

          <n-button type="primary" @click="openDialog()"> 查看 </n-button>

          <n-button
            type="primary"
            v-access:code="['sys:notice:top']"
            @click="handleTopNotice"
          >
            置顶
          </n-button>

          <n-button
            type="primary"
            v-access:code="['sys:notice:cancelTop']"
            @click="handleCancelTopNotice"
          >
            取消置顶
          </n-button>

          <n-button
            type="primary"
            v-access:code="['sys:notice:publish']"
            @click="publishNotices"
          >
            发布
          </n-button>

          <n-button
            type="primary"
            v-access:code="['sys:notice:cancelPublish']"
            @click="cancelPublishNotices"
          >
            取消发布
          </n-button>

          <n-button
            type="error"
            :disabled="noticeIds.length === 0"
            v-access:code="['sys:notice:delete']"
            @click="handleDelete()"
          >
            <template #icon>
              <n-icon><Delete /></n-icon>
            </template>
            删除
          </n-button>
        </n-form-item>
      </n-form>

      <n-data-table
        ref="dataTableRef"
        :loading="loading"
        :data="noticeTableData"
        :columns="columns"
        :pagination="false"
        :bordered="true"
        :scroll-x="1000"
        @update:checked-row-keys="handleSelectionChange"
      />
      <n-pagination
        v-if="total > 0"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :item-count="total"
        :page-sizes="[10, 20, 30, 40, 50, 100]"
        show-size-picker
        @update:page="handleQuery"
        @update:page-size="handleQuery"
      />

    <!-- 表单弹窗 -->
    <NoticeFormDrawer ref="noticeFormDrawerRef" @success="resetQuery" />
  </div>
</template>
