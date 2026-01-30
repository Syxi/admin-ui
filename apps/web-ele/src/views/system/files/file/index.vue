<script setup lang="ts">
import type { FileRecordQuery, FileRecordVO } from '#/api/system/files/file';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  deleteFileApi,
  handleDownloadPdfFileApi,
  handleDownloadPdfFileWithResumeApi,
  handleDownloadSourceFileApi,
  handleDownloadSourceFileWithResumeApi,
  selectFilePageApi,
} from '#/api/system/files/file';
import { useAccessStore } from '@vben/stores';
import { useCardHeight } from '#/hooks/useCardHeight';
import FileUploadDialog from '#/views/system/files/file/FileUploadDialog.vue';
import ChunkUploadDialog from '#/views/system/files/file/ChunkUploadDialog.vue';
import PdfViewDialog from '#/views/system/files/file/PdfViewDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";

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
const queryForm = ref(ElForm);

// 分页列表数据
const fileTableData = ref<FileRecordVO[]>();

const fileIds = ref<string[]>([]);

const fileUploadDialogRef = ref();
function openUploadFileDialog() {
  fileUploadDialogRef.value.openDialog();
}

const chunkUploadDialogRef = ref();
function openChunkUploadDialog() {
  chunkUploadDialogRef.value.openDialog();
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
  queryForm.value.resetFields();
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
    ElMessage.warning('请勾选删除项！');
    return;
  }

  ElMessageBox.confirm('确定删除文件?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteFileApi(ids).then(() => {
      ElMessage.success('删除成功!');
      resetQuery();
    });
  });
}

/**
 * 下载文件
 * @param row
 */
async function handleDownloadFile(row: FileRecordVO) {
  try {
    // 使用断点续传下载
    const downloadUrl = await handleDownloadSourceFileWithResumeApi(row.id);
    const fullUrl = `${import.meta.env.VITE_GLOB_API_URL}${downloadUrl}`;

    // 使用增强下载器
    const { downloadWithResume } = await import('#/utils/enhanced-file-downloader');
    const accessStore = useAccessStore();
    const token = accessStore.accessToken;
    
    await downloadWithResume(fullUrl, row.fileName, {
      onProgress: (progress) => {
        console.log(`下载进度: ${progress}%`);
      },
      onSpeed: (speed) => {
        console.log(`下载速度: ${speed}`);
      },
      onComplete: () => {
        ElMessage.success(`${row.fileName} 下载完成`);
      },
      onError: (error) => {
        ElMessage.error(`文件下载失败: ${error.message}`);
      },
      token: token  // 传递认证令牌
    });
  } catch (error) {
    console.error('文件下载失败:', error);
    ElMessage.error('文件下载失败，请稍后再试!');
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
    ElMessage.error('文件下载失败，请稍后再试!');
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
//       ElMessage.error(error);
//     });
//     // file=dev/pdf/318c3157280bf8d33d2218d7e69f7780.pdf
//     const path = `${import.meta.env.VITE_GLOB_API_URL}${row.url}${row.fileMd5}.pdf`;
//     const pdfUrl = `/static/pdfjs/web/viewer.html?file=${path}`;
//     const newWindow = window.open(pdfUrl, '_blank');
//     if (!newWindow) {
//       ElMessage.error('未能打开新窗口预览PDF,请允许弹出窗口或调整浏览器设置');
//     }
//   } catch {
//     ElMessage.warning('文件转换错误，请联系管理员');
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
            :disabled="fileIds.length === 0"
            v-access:code="['sys:file:delete']"
            @click="handleDeleteFile()"
          >
            <template #icon>
              <el-icon><Delete /></el-icon>
            </template>
            删除
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:file:upload']"
            @click="openChunkUploadDialog()"
          >
            <el-icon> <Upload /> </el-icon>上传文件
          </el-button>
        </el-form-item>
      </ElForm>

      <el-table
        v-loading="loading"
        :data="fileTableData"
        border
        :height="tableHeight"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="false" prop="id" />

        <el-table-column v-if="false" prop="fileSha256" />

        <el-table-column type="selection" width="50" align="center" />

        <el-table-column type="index" label="序号" width="80" align="center" />

        <el-table-column prop="fileName" label="文件名称" align="center" />

        <el-table-column prop="fileSize" label="文件大小" align="center" />

        <el-table-column
          prop="createTime"
          label="文件上传时间"
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
              @click="openPreviewFileDialog(scope.row)"
            >
              预览
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:file:downloadSourceFile']"
              @click="handleDownloadFile(scope.row)"
            >
              下载原文件
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:file:downloadPdfFile']"
              @click="handleDownloadPdfFile(scope.row)"
            >
              下载pdf文件
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:file:delete']"
              @click="handleDeleteFile(scope.row.id)"
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

    <!--上传文件弹窗-->
<!--    <FileUploadDialog ref="fileUploadDialogRef" @success="resetQuery" />-->
    <ChunkUploadDialog ref="chunkUploadDialogRef" @success="resetQuery" />

    <!-- 使用dialog查看pdf -->
    <PdfViewDialog ref="previewFileDialogRef" />
  </div>
</template>
