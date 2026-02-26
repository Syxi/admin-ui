<script setup lang="ts">
import type { NotePage, NoteQuery } from '#/api/system/note/note';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  deleteNoteApi,
  selectNotePageApi,
} from '#/api/system/note/note';
import { useAutoHeight } from '#/hooks/useAutoHeight';
import NoteFormDialog from '#/views/system/note/NoteFormDialog.vue';
import NoteViewDialog from '#/views/system/note/NoteViewDialog.vue';
import { useTableHeight } from "#/hooks/useTableHeight";

const props = defineProps<{
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

defineOptions({
  name: 'Note',
  inheritAttrs: false,
});

// 加载状态
const loading = ref(false);

// 笔记ids
const noteIds = ref<string[]>([]);

// 查询参数
const queryParams = reactive<NoteQuery>({
  page: 1,
  limit: 20,
});

// 分页总记录数
const total = ref(0);

// 分页列表数据
const noteTableData = ref<NotePage[]>();

// 查询表单
const queryFormRef = ref(ElForm);

// 笔记表单子组件
const noteFormDialogRef = ref();
function openFormDialog(noteId?: string) {
  noteFormDialogRef.value.openDialog(noteId);
}

// 笔记查看子组件
const noteViewDialogRef = ref();
function openViewDialog(noteId: string) {
  noteViewDialogRef.value.openDialog(noteId);
}

// 查询笔记事件
async function handleQuery() {
  loading.value = true;
  try {
    const data = await selectNotePageApi(queryParams);
    noteTableData.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

// 重置查询事件
function resetQuery() {
  queryFormRef.value.resetFields();
  queryParams.page = 1;
  handleQuery();
}

// 行checkbox 单选或多选事件
function handleSelectionChange(selection: any) {
  noteIds.value = selection.map((item: any) => item.noteId);
}

// 删除笔记事件
async function handleDelete(noteId?: string) {
  let ids: string[];
  if (noteId) {
    ids = [String(noteId)]; // 删除单条记录
  } else if (noteIds.value.length > 0) {
    ids = noteIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除笔记?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteNoteApi(ids);
    ElMessage.success('删除成功!');
    resetQuery();
  });
}

onMounted(() => {
  // 初始化笔记列表数据
  handleQuery();
});

const { tableHeight } = useTableHeight(queryFormRef, {
  headerHeight: 100, // 增加头部高度以适应实际布局
  tableOffset: -80   // 调整表格偏移量
});
</script>

<template>
  <div class="note-container">
    <div class="data-container">
      <ElForm :model="queryParams" ref="queryFormRef" :inline="true">
        <el-form-item prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入笔记标题"
            @keyup.enter="handleQuery()"
            clearable
          />
        </el-form-item>

<!--        <el-form-item prop="content">-->
<!--          <el-input-->
<!--            v-model="queryParams.content"-->
<!--            placeholder="请输入笔记内容"-->
<!--            @keyup.enter="handleQuery()"-->
<!--            clearable-->
<!--          />-->
<!--        </el-form-item>-->

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

          <el-button
            type="primary"
            @click="openFormDialog()"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>

          <el-button type="danger" @click="handleDelete()">
            <template #icon>
              <el-icon><DeleteFilled /></el-icon>
            </template>
            批量删除
          </el-button>
        </el-form-item>
      </ElForm>

      <el-table
        v-loading="loading"
        border
        :data="noteTableData"
        @selection-change="handleSelectionChange"
        :height="tableHeight"
      >
        <el-table-column type="selection" width="50" align="center" />

        <el-table-column
          type="index"
          label="序号"
          width="80"
          align="center"
        />

        <el-table-column
          key="title"
          label="笔记标题"
          prop="title"
          align="center"
          :show-overflow-tooltip="true"
        />

        <el-table-column
          label="状态"
          prop="status"
          align="center"
          width="80"
        >
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="创建时间"
          prop="createTime"
          align="center"
          width="160"
        />

        <el-table-column
          label="更新时间"
          prop="updateTime"
          align="center"
          width="160"
        />

        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              @click="openViewDialog(scope.row.noteId)"
            >
              <el-icon><View /></el-icon>查看
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              @click="openFormDialog(scope.row.noteId)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              type="danger"
              size="small"
              link
              @click="handleDelete(scope.row.noteId)"
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
    </div>

    <!-- 表单弹窗 -->
    <NoteFormDialog ref="noteFormDialogRef" @success="resetQuery" />

    <!-- 查看弹窗 -->
    <NoteViewDialog ref="noteViewDialogRef" />
  </div>
</template>

<style lang="scss" scoped>
.note-container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: hsl(var(--background));
}

.data-container {
  width: 100%;
  height: 100%;
  padding: 30px 20px 0 20px;
}
</style>
