<script setup lang="ts">
import type {
  NoticeQuery,
  NoticeVO,
} from '#/api/system/sys/notice';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  cancelPublishNoticesApi,
  cancelTopNoticeApi,
  deleteNoticeApi,
  publishNoticesApi,
  selectNoticePageApi,
  topNoticeApi,
} from '#/api/system/sys/notice';
import {useCardHeight} from "#/hooks/useCardHeight";
import NoticeFormDrawer from "#/views/system/sys/notice/NoticeFormDrawer.vue";
import {useTableHeight} from "#/hooks/useTableHeight";

defineOptions({
  name: 'Notice',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const loading = ref(false);

const noticeIds = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<NoticeQuery>({
  noticeTitle: '',
  page: 1,
  limit: 20,
});

const noticeTableData = ref<NoticeVO[]>();

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
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据项', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    loading.value = true;
    deleteNoticeApi(ids)
      .then(() => {
        ElMessage.success('删除成功');
        resetQuery();
      })
      .finally(() => {
        loading.value = false;
      });
  });
}

/**
 * 置顶通知
 */
function handleTopNotice() {
  if (noticeIds.value.length === 0) {
    ElMessage.error('请勾选置顶项');
  } else if (noticeIds.value.length > 1) {
    ElMessage.error('不能置顶多条通知');
  } else {
    const noticeId = String(noticeIds.value[0]); // 勾选一条通知
    topNoticeApi(noticeId).then(() => {
      ElMessage.success('置顶通知成功');
      resetQuery();
    });
  }
}

/**
 *  取消置顶通知
 */
function handleCancelTopNotice() {
  if (noticeIds.value.length === 0) {
    ElMessage.error('请勾取消选置顶项');
  } else if (noticeIds.value.length > 1) {
    ElMessage.error('不能取消置顶多条通知');
  } else {
    const noticeId = String(noticeIds.value[0]); // 勾选一条通知
    cancelTopNoticeApi(noticeId).then(() => {
      ElMessage.success('取消置顶通知成功');
      resetQuery();
    });
  }
}

/**
 * 发布通知
 */
function publishNotices() {
  if (noticeIds.value.length === 0) {
    ElMessage.error('请勾选发布项');
  } else {
    publishNoticesApi(noticeIds.value).then(() => {
      ElMessage.success('发布通知成功');
      resetQuery();
    });
  }
}

/**
 * 取消发布通知
 */
function cancelPublishNotices() {
  if (noticeIds.value.length === 0) {
    ElMessage.error('请勾选发布项');
  } else {
    cancelPublishNoticesApi(noticeIds.value).then(() => {
      ElMessage.success('取消发布通知成功');
      resetQuery();
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
      <ElForm ref="queryFormRef" :model="queryParams" :inline="true" @submit.prevent>
        <el-form-item prop="roleName">
          <el-input
            v-model="queryParams.noticeTitle"
            placeholder="通知标题"
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
            v-access:code="['sys:notice:add']"
            @click="openDialog()"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>

          <el-button type="primary" @click="openDialog()"> 查看 </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:notice:top']"
            @click="handleTopNotice"
          >
            置顶
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:notice:cancelTop']"
            @click="handleCancelTopNotice"
          >
            取消置顶
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:notice:publish']"
            @click="publishNotices"
          >
            发布
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:notice:cancelPublish']"
            @click="cancelPublishNotices"
          >
            取消发布
          </el-button>

          <el-button
            type="danger"
            :disabled="noticeIds.length === 0"
            v-access:code="['sys:notice:delete']"
            @click="handleDelete()"
          >
            <template #icon>
              <el-icon><Delete /></el-icon>
            </template>
            删除
          </el-button>
        </el-form-item>
      </ElForm>

      <el-table
        ref="dataTableRef"
        v-loading="loading"
        :data="noticeTableData"
        highlight-current-row
        border
        :height="tableHeight"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="80" align="center" />

        <el-table-column
          label="通知标题"
          prop="noticeTitle"
          width="200"
          align="center"
        />

        <el-table-column
          label="通知内容"
          prop="noticeContent"
          width="200"
          align="center"
        />

        <el-table-column label="置顶" prop="isTop" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.isTop === 1" type="success">置顶</el-tag>
            <el-tag v-else type="info">未置顶</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="状态"
          prop="isPublish"
          width="120"
          align="center"
        >
          <template #default="scope">
            <el-tag v-if="scope.row.isPublish === 1" type="success">
              发布
            </el-tag>
            <el-tag v-else type="info">未发布</el-tag>
          </template>
        </el-table-column>

        <!-- <el-table-column
            label="置顶时间"
            prop="topTime"
            width="250"
            align="center"
          /> -->

        <el-table-column
          label="创建时间"
          prop="createTime"
          width="250"
          align="center"
        />

        <el-table-column
          label="更新时间"
          prop="updateTime"
          width="250"
          align="center"
        />

        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:notice:edit']"
              @click="openDialog(scope.row.noticeId)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:notice:delete']"
              @click="handleDelete(scope.row.noticeId)"
            >
              <el-icon><Delete /></el-icon>
              删除
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

    <!-- 表单弹窗 -->
    <NoticeFormDrawer ref="noticeFormDrawerRef" @success="resetQuery" />
  </div>
</template>
