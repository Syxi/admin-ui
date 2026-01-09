<script setup lang="ts">
import type { VideoQuery, VideoVO } from '#/api/system/media/video';

import { h, onMounted, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NButton, NDataTable, NPagination, NIcon, NSpace } from 'naive-ui';
import { message, dialog } from '#/hooks';

import {
  deleteVideoApi,
  downloadVideoApi,
  selectVideosPageApi,
} from '#/api/system/media/video';
import { useCardHeight } from '#/hooks/useCardHeight';
import VideoPlayerDialog from '#/views/system/media/video/VideoPlayerDialog.vue';
import VideoUploadDialog from '#/views/system/media/video/VideoUploadDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";
import { Icon } from '@iconify/vue';

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
const queryForm = ref();

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
  queryForm.value?.restoreValidation();
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
    message.error('文件下载失败，请稍后再试!');
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
    message.warning('请勾选删除项！');
    return;
  }

  dialog.warning({
    title: '警告',
    content: '确定删除视频?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      deleteVideoApi(ids).then(() => {
        message.success('删除成功!');
        resetQuery();
      });
    }
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
      <NForm
        :model="queryParams"
        ref="queryForm"
        :inline="true"
        @submit.prevent
      >
        <NFormItem>
          <NInput
            v-model:value="queryParams.fileName"
            placeholder="请输入文件名"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery()"
          />
        </NFormItem>

        <NFormItem>
          <NButton type="primary" @click="handleQuery()">
            <template #icon>
              <NIcon><Icon icon="mdi:magnify" /></NIcon>
            </template>
            搜索
          </NButton>

          <NButton type="primary" @click="resetQuery()">
            <template #icon>
              <NIcon><Icon icon="mdi:refresh" /></NIcon>
            </template>
            重置
          </NButton>

          <NButton
            type="error"
            :disabled="videoIds.length === 0"
            v-access:code="['sys:video:delete']"
            @click="handleDeleteVideo()"
          >
            <template #icon>
              <NIcon><Icon icon="mdi:delete" /></NIcon>
            </template>
            删除
          </NButton>

          <NButton
            type="primary"
            v-access:code="['sys:video:upload']"
            @click="openUploadDialog()"
          >
            <NIcon><Icon icon="mdi:upload" /></NIcon>上传视频
          </NButton>
        </NFormItem>
      </NForm>

      <NDataTable
        v-model:checked-row-keys="videoIds"
        :loading="loading"
        :data="videoTableData"
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
            title: '视频名称',
            key: 'fileName',
            align: 'center'
          },
          {
            title: '视频上传时间',
            key: 'createTime',
            align: 'center'
          },
          {
            title: '操作',
            key: 'actions',
            render: (row) => {
              return h(NSpace, null, {
                default: () => [
                  h(NButton, {
                    type: 'primary',
                    size: 'small',
                    quaternary: true,
                    onClick: () => playerVideo(row.fileName, row.url)
                  }, { default: () => '播放' }),
                  h(NButton, {
                    type: 'primary',
                    size: 'small',
                    quaternary: true,
                    onClick: () => handleDownloadVideo(row.fileName)
                  }, { default: () => '下载' }),
                  h(NButton, {
                    type: 'error',
                    size: 'small',
                    quaternary: true,
                    onClick: () => handleDeleteVideo(row.id)
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

      <VideoPlayerDialog ref="videoPlayerDialogRef" />
      <VideoUploadDialog ref="videoUploadDialogRef" @success="handleQuery" />
  </div>
</template>