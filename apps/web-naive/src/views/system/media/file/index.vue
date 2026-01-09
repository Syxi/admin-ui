<script setup lang="ts">
import type { FileRecordQuery, FileRecordVO } from '#/api/system/media/file';

import { h, onMounted, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NButton, NDataTable, NPagination, NIcon, NSpace } from 'naive-ui';
import { message, dialog } from '#/hooks';

import {
  deleteFileApi,
  handleDownloadPdfFileApi,
  handleDownloadSourceFileApi,
  selectFilePageApi,
} from '#/api/system/media/file';
import { useCardHeight } from '#/hooks/useCardHeight';
import FileUploadDialog from '#/views/system/media/file/FileUploadDialog.vue';
import PdfViewDialog from '#/views/system/media/file/PdfViewDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";
import { Icon } from '@iconify/vue';

defineOptions({
  name: 'File',
  inheritAttrs: false,
});

// 加载状态
const loading = ref(false);

// 分页总记录数
const total = ref(0);

// 查询参数
const queryParams = reactive<FileRecordQuery>({
  page: 1,
  limit: 20,
});

// 查询表单
const queryForm = ref();

// 分页列表数据
const fileTableData = ref<FileRecordVO[]>();

const fileIds = ref<string[]>([]);

const fileUploadDialogRef = ref();
function openUploadFileDialog() {
  fileUploadDialogRef.value.openDialog();
}

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  fileIds.value = selection.map((item: any) => item.id);
}

// 查询文件
function handleQuery() {
  loading.value = true;
  selectFilePageApi(queryParams)
    .then((data) => {
      fileTableData.value = data.list;
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
 * 删除文件
 * @param id
 */
function handleDeleteFile(id?: string) {
  let ids: string[];
  if (id) {
    ids = [String(id)]; // 删除单条记录
  } else if (fileIds.value.length > 0) {
    ids = fileIds.value; // 删除多条记录
  } else {
    message.warning('请勾选删除项！');
    return;
  }

  dialog.warning({
    title: '警告',
    content: '确定删除文件?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      deleteFileApi(ids).then(() => {
        message.success('删除成功!');
        resetQuery();
      });
    }
  });
}

/**
 * 下载文件
 * @param row
 */
async function handleDownloadFile(row: FileRecordVO) {
  try {
    const id = row.id;
    const response = await handleDownloadSourceFileApi(id);

    // 处理下载逻辑
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const fileName = row.fileName;

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
 * 下载pdf文件
 */
async function handleDownloadPdfFile(row: FileRecordVO) {
  try {
    const id = row.id;

    const response = await handleDownloadPdfFileApi(id);

    // 处理下载逻辑
    const url = window.URL.createObjectURL(new Blob([response.data]));
    // 文件拓展名为pdf
    const fileName = `${row.fileName.split('.').slice(0, -1).join('.')}.pdf`;

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
 * 浏览器新窗口打开viewer插件预览
 *
 跨域问题 在项目的/lib/pdfjs/web/viewer.mjs中注释掉以下代码
 if (fileOrigin !== viewerOrigin) {
 throw new Error("file origin does not match viewer's");
 }
 */
// function handlePreviewFile(row: FileRecordVO) {
//   try {
//     checkFileConvertStatusApi(row.id).catch((error) => {
//       message.error(error);
//     });
//     // file=dev/pdf/318c3157280bf8d33d2218d7e69f7780.pdf
//     const path = `${import.meta.env.VITE_GLOB_API_URL}${row.url}${row.fileMd5}.pdf`;
//     const pdfUrl = `/static/pdfjs/web/viewer.html?file=${path}`;
//     const newWindow = window.open(pdfUrl, '_blank');
//     if (!newWindow) {
//       message.error('未能打开新窗口预览PDF,请允许弹出窗口或调整浏览器设置');
//     }
//   } catch {
//     message.warning('文件转换错误，请联系管理员');
//   }
// }

const previewFileDialogRef = ref();
function openPreviewFileDialog(row: FileRecordVO) {
  previewFileDialogRef.value.handlePreviewFile(row);
}

onMounted(() => {
  handleQuery();
});

const { tableHeight } = useTableHeight(queryForm);
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
            :disabled="fileIds.length === 0"
            v-access:code="['sys:file:delete']"
            @click="handleDeleteFile()"
          >
            <template #icon>
              <NIcon><Icon icon="mdi:delete" /></NIcon>
            </template>
            删除
          </NButton>

          <NButton
            type="primary"
            v-access:code="['sys:file:upload']"
            @click="openUploadFileDialog()"
          >
            <NIcon> <Icon icon="mdi:upload" /> </NIcon>上传文件
          </NButton>
        </NFormItem>
      </NForm>

      <NDataTable
        v-model:checked-row-keys="fileIds"
        :loading="loading"
        :data="fileTableData"
        :columns="[
          {
            type: 'selection',
            width: 50,
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
            title: '文件名称',
            key: 'fileName',
            align: 'center'
          },
          {
            title: '文件大小',
            key: 'fileSize',
            align: 'center'
          },
          {
            title: '文件上传时间',
            key: 'createTime',
            align: 'center'
          },
          {
            title: '操作',
            key: 'actions',
            width: 300,
            render: (row) => {
              return h(NSpace, null, {
                default: () => [
                  h(NButton, {
                    type: 'primary',
                    size: 'small',
                    quaternary: true,
                    onClick: () => openPreviewFileDialog(row)
                  }, { default: () => '预览' }),
                  h(NButton, {
                    type: 'primary',
                    size: 'small',
                    quaternary: true,
                    onClick: () => handleDownloadFile(row)
                  }, { default: () => '下载原文件' }),
                  h(NButton, {
                    type: 'primary',
                    size: 'small',
                    quaternary: true,
                    onClick: () => handleDownloadPdfFile(row)
                  }, { default: () => '下载pdf文件' }),
                  h(NButton, {
                    type: 'error',
                    size: 'small',
                    quaternary: true,
                    onClick: () => handleDeleteFile(row.id)
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
    
    <!--上传文件弹窗-->
    <FileUploadDialog ref="fileUploadDialogRef" @success="resetQuery" />

    <!-- 使用dialog查看pdf -->
    <PdfViewDialog ref="previewFileDialogRef" />
  </div>
</template>