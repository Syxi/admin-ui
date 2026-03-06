<script setup lang="ts">
import type { VideoQuery, VideoVO } from '#/api/system/files/video';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  deleteVideoApi,
  downloadVideoApi,
  selectVideosPageApi,
} from '#/api/system/files/video';

import VideoPlayerDialog from '#/views/system/files/video/VideoPlayerDialog.vue';
import VideoUploadDialog from '#/views/system/files/video/VideoUploadDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";

// import 'video.js/dist/video-js.css';

defineOptions({
  name: 'Video',
  inheritAttrs: false,
});

// 加载状态
const loading = ref(false);

// 分页总记录数
const total = ref(0);

// 查询参数
const queryParams = reactive<VideoQuery>({
  page: 1,
  limit: 20,
});

// 查询表单
const queryForm = ref(ElForm);

const videoIds = ref<string[]>([]);

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  videoIds.value = selection.map((item: any) => item.id);
}

// 分页列表数据
const videoTableData = ref<VideoVO[]>();

// 查询文件
function handleQuery() {
  loading.value = true;
  selectVideosPageApi(queryParams)
    .then((data) => {
      videoTableData.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 重置查询
function resetQuery() {
  queryForm.value.resetFields();
  queryParams.fileName = '';
  queryParams.page = 1;
  handleQuery();
}

/**
 * 下载文件
 * @param fileName
 */
async function handleDownloadVideo(fileName: string) {
  try {
    const response = await downloadVideoApi(fileName);
    // 处理下载逻辑
    const url = window.URL.createObjectURL(new Blob([response.data]));
    // 创建隐藏的可下载链接元素
    const link = document.createElement('a');
    link.href = url;

    link.download = fileName;

    link.click();
    window.URL.revokeObjectURL(url);
  } catch {
    ElMessage.error('文件下载失败，请稍后再试!');
  }
}

/**
 * 删除文件
 * @param id
 */
function handleDeleteVideo(id?: string) {
  let ids: string[];
  if (id) {
    ids = [String(id)]; // 删除单条记录
  } else if (videoIds.value.length > 0) {
    ids = videoIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项！');
    return;
  }

  ElMessageBox.confirm('确定删除视频?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteVideoApi(ids).then(() => {
      ElMessage.success('删除成功!');
      resetQuery();
    });
  });
}

const { tableHeight } = useTableHeight(queryForm);

// 播放视频子组件
const videoPlayerDialogRef = ref();
function playerVideo(fileName: string, url: string) {
  videoPlayerDialogRef.value.handlePlayVideo(fileName, url);
}

// 上传视频子组件
const videoUploadDialogRef = ref();
function openUploadDialog() {
  videoUploadDialogRef.value.openDialog();
}

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div class="app-container">
      <ElForm
        :model="queryParams"
        ref="queryForm"
        :inline="true"
        @submit.prevent
      >
        <el-form-item>
          <el-input
            v-model="queryParams.fileName"
            placeholder="请输入文件名"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery()"
          />
        </el-form-item>

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
            type="danger"
            :disabled="videoIds.length === 0"
            v-access:code="['sys:video:delete']"
            @click="handleDeleteVideo()"
          >
            <template #icon>
              <el-icon><Delete /></el-icon>
            </template>
            删除
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:video:upload']"
            @click="openUploadDialog()"
          >
            <el-icon><Upload /></el-icon>上传视频
          </el-button>
        </el-form-item>
      </ElForm>

      <el-table
        v-loading="loading"
        :data="videoTableData"
        border
        :height="tableHeight"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="false" prop="id" />
        <el-table-column v-if="false" prop="filePath" />
        <el-table-column type="selection" width="80" align="center" />

        <el-table-column type="index" label="序号" width="80" align="center" />

        <el-table-column prop="fileName" label="视频名称" align="center" />

        <el-table-column
          prop="createTime"
          label="视频上传时间"
          align="center"
        />

        <!-- @click="handlePreviewFile(scope.row.id, scope.row.fileName)"  -->
        <el-table-column label="操作">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:file:previewer']"
              @click="playerVideo(scope.row.fileName, scope.row.url)"
            >
              播放
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:video:download']"
              @click="handleDownloadVideo(scope.row.fileName)"
            >
              下载
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:video:delete']"
              @click="handleDeleteVideo(scope.row.id)"
            >
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

      <VideoPlayerDialog ref="videoPlayerDialogRef" />
      <VideoUploadDialog ref="videoUploadDialogRef" @success="handleQuery" />
  </div>
</template>
