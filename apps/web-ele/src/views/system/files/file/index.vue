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

// 下载进度相关
const downloadProgress = ref(0); // 当前下载进度
const downloadSpeed = ref(''); // 下载速度
const downloadedInfo = ref(''); // 已下载的信息
const downloadDialogVisible = ref(false); // 下载进度弹窗可见性
const currentDownloadingFile = ref(''); // 当前下载的文件名

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

    // 设置下载信息并打开弹窗
    downloadProgress.value = 0;
    downloadSpeed.value = '';
    downloadedInfo.value = '0.00 MB / 0.00 MB';
    currentDownloadingFile.value = row.fileName;
    downloadDialogVisible.value = true;

    await downloadWithResume(fullUrl, row.fileName, {
      onProgress: (progress, downloaded, total) => {
        downloadProgress.value = progress; // 更新下载进度
        // 更新已下载信息
        const downloadedMB = (downloaded / (1024 * 1024)).toFixed(2);
        const totalMB = (total / (1024 * 1024)).toFixed(2);
        downloadedInfo.value = `${downloadedMB} MB / ${totalMB} MB`;
      },
      onSpeed: (speed) => {
        downloadSpeed.value = speed; // 更新下载速度
      },
      onComplete: () => {
        ElMessage.success(`${row.fileName} 下载完成`);
        downloadProgress.value = 100; // 下载完成，进度设为100%
        // 延迟关闭弹窗，让用户看到完成状态
        setTimeout(() => {
          downloadDialogVisible.value = false;
          downloadProgress.value = 0;
          downloadSpeed.value = '';
          downloadedInfo.value = '';
          currentDownloadingFile.value = '';
        }, 1000);
      },
      onError: (error) => {
        ElMessage.error(`文件下载失败: ${error.message}`);
        // 延迟关闭弹窗
        setTimeout(() => {
          downloadDialogVisible.value = false;
          downloadProgress.value = 0;
          downloadSpeed.value = '';
          downloadedInfo.value = '';
          currentDownloadingFile.value = '';
        }, 1000);
      },
      token: token  // 传递认证令牌
    });
  } catch (error) {
    console.error('文件下载失败:', error);
    ElMessage.error('文件下载失败，请稍后再试!');
    downloadDialogVisible.value = false;
    downloadProgress.value = 0;
    downloadSpeed.value = '';
    downloadedInfo.value = '';
    currentDownloadingFile.value = '';
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

// 批量下载相关变量
const batchDownloadProgress = ref(0); // 批量下载整体进度
const currentBatchIndex = ref(0); // 当前下载的文件索引
const totalBatchCount = ref(0); // 总文件数量
const batchDownloadStatus = ref([]); // 批量下载状态数组
const batchDownloadFiles = ref([]); // 批量下载的文件列表

/**
 * 获取选中的文件详情
 */
async function getSelectedFiles() {
  // 从当前表格数据中筛选出选中的文件
  const selectedFiles = fileTableData.value?.filter(file => 
    fileIds.value.includes(file.id)
  ) || [];
  
  return selectedFiles;
}

/**
 * 批量下载文件 - 按顺序逐个下载
 */
async function handleBatchDownload() {
  if (fileIds.value.length <= 1) {
    ElMessage.warning('请选择至少两个文件进行批量下载！');
    return;
  }

  try {
    // 获取选中的文件详情
    const selectedFiles = await getSelectedFiles();
    if (selectedFiles.length === 0) {
      ElMessage.warning('未找到选中的文件信息！');
      return;
    }

    // 初始化批量下载状态
    totalBatchCount.value = selectedFiles.length;
    currentBatchIndex.value = 0;
    batchDownloadProgress.value = 0;
    batchDownloadStatus.value = new Array(selectedFiles.length).fill('pending'); // 初始化状态数组
    batchDownloadFiles.value = selectedFiles; // 存储文件列表用于UI显示

    // 显示批量下载进度弹窗
    downloadDialogVisible.value = true;

    // 按顺序逐个下载文件
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      currentBatchIndex.value = i + 1;
      
      // 更新当前下载文件名
      currentDownloadingFile.value = `${file.fileName} (${currentBatchIndex.value}/${totalBatchCount.value})`;
      
      try {
        // 标记当前文件开始下载
        batchDownloadStatus.value[i] = 'downloading';
        
        // 使用断点续传下载
        const downloadUrl = await handleDownloadSourceFileWithResumeApi(file.id);
        const fullUrl = `${import.meta.env.VITE_GLOB_API_URL}${downloadUrl}`;

        // 使用增强下载器
        const { downloadWithResume } = await import('#/utils/enhanced-file-downloader');
        const accessStore = useAccessStore();
        const token = accessStore.accessToken;

        // 执行下载
        await downloadWithResume(fullUrl, file.fileName, {
          onProgress: (progress, downloaded, total) => {
            downloadProgress.value = progress; // 更新当前文件下载进度
            // 更新已下载信息
            const downloadedMB = (downloaded / (1024 * 1024)).toFixed(2);
            const totalMB = (total / (1024 * 1024)).toFixed(2);
            downloadedInfo.value = `${downloadedMB} MB / ${totalMB} MB`;
          },
          onSpeed: (speed) => {
            downloadSpeed.value = speed; // 更新下载速度
          },
          onComplete: () => {
            // 标记当前文件下载完成
            batchDownloadStatus.value[i] = 'completed';
            
            // 计算整体进度
            const completedCount = batchDownloadStatus.value.filter(status => status === 'completed').length;
            batchDownloadProgress.value = Math.round((completedCount / totalBatchCount.value) * 100);
            
            ElMessage.success(`${file.fileName} 下载完成`);
          },
          onError: (error) => {
            // 标记当前文件下载失败
            batchDownloadStatus.value[i] = 'failed';
            
            // 计算整体进度
            const completedCount = batchDownloadStatus.value.filter(status => status === 'completed').length;
            batchDownloadProgress.value = Math.round((completedCount / totalBatchCount.value) * 100);
            
            ElMessage.error(`文件 ${file.fileName} 下载失败: ${error.message}`);
          },
          token: token  // 传递认证令牌
        });
      } catch (error) {
        console.error(`文件 ${file.fileName} 下载失败:`, error);
        batchDownloadStatus.value[i] = 'failed';
        ElMessage.error(`文件 ${file.fileName} 下载失败，请稍后再试!`);
      }
    }

    // 全部下载完成后统一提示
    const failedCount = batchDownloadStatus.value.filter(status => status === 'failed').length;
    const completedCount = batchDownloadStatus.value.filter(status => status === 'completed').length;
    
    if (failedCount === 0) {
      ElMessage.success(`全部 ${totalBatchCount.value} 个文件下载完成！`);
    } else {
      ElMessage.warning(`下载完成，成功 ${completedCount} 个，失败 ${failedCount} 个`);
    }

    // 下载完成后延迟关闭弹窗，让用户看到完成状态
    setTimeout(() => {
      downloadDialogVisible.value = false;
      downloadProgress.value = 0;
      downloadSpeed.value = '';
      downloadedInfo.value = '';
      currentDownloadingFile.value = '';
      batchDownloadProgress.value = 0;
      currentBatchIndex.value = 0;
      totalBatchCount.value = 0;
      batchDownloadStatus.value = [];
      batchDownloadFiles.value = [];
    }, 2000);
  } catch (error) {
    console.error('批量下载失败:', error);
    ElMessage.error('批量下载失败，请稍后再试!');
    downloadDialogVisible.value = false;
    downloadProgress.value = 0;
    downloadSpeed.value = '';
    downloadedInfo.value = '';
    currentDownloadingFile.value = '';
    batchDownloadProgress.value = 0;
    currentBatchIndex.value = 0;
    totalBatchCount.value = 0;
    batchDownloadStatus.value = [];
    batchDownloadFiles.value = [];
  }
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
            type="success"
            :disabled="fileIds.length <= 1"
            v-access:code="['sys:file:downloadSourceFile']"
            @click="handleBatchDownload()"
          >
            <template #icon>
              <el-icon><Download /></el-icon>
            </template>
            批量下载
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

    <!-- 下载进度弹窗 -->
    <el-dialog
      v-model="downloadDialogVisible"
      title="文件下载进度"
      width="600px"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      center
    >
      <div>
        <p v-if="totalBatchCount <= 1">正在下载: {{ currentDownloadingFile }}</p>
        <!-- 批量下载进度显示 -->
        <div v-if="totalBatchCount > 1" style="max-height: 400px; overflow-y: auto;">
          <p>批量下载进度 ({{ currentBatchIndex }}/{{ totalBatchCount }})</p>
          <!-- 每个文件的进度条 -->
          <div 
            v-for="(file, index) in batchDownloadFiles" 
            :key="index"
            style="margin-bottom: 10px; padding: 8px; border: 1px solid #eee; border-radius: 4px;"
          >
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%;">
                {{ index < currentBatchIndex - 1 ? '✓ ' : '' }}{{ file.fileName }}
              </span>
              <span style="font-size: 12px; color: #888;">
                {{ batchDownloadStatus[index] === 'completed' ? '已完成' : batchDownloadStatus[index] === 'downloading' && index === currentBatchIndex - 1 ? '下载中...' : batchDownloadStatus[index] === 'failed' ? '失败' : '待下载' }}
              </span>
            </div>
            <el-progress
              :percentage="index < currentBatchIndex - 1 ? 100 : index === currentBatchIndex - 1 ? downloadProgress : 0"
              :format="(percentage) => `${percentage}%`"
              :stroke-width="12"
              :status="index < currentBatchIndex - 1 ? 'success' : index === currentBatchIndex - 1 ? (downloadProgress === 100 ? 'success' : 'normal') : 'normal'"
              style="margin: 5px 0;"
            />
            <!-- 当前正在下载的文件显示详细进度 -->
            <div v-if="index === currentBatchIndex - 1 && totalBatchCount > 1" style="font-size: 12px; color: #666; margin-top: 3px;">
              <span>已下载: {{ downloadedInfo }}</span>
              <span style="margin-left: 10px;">速度: {{ downloadSpeed }}</span>
            </div>
          </div>
          <!-- 整体进度 -->
          <div style="margin-top: 15px;">
            <p>整体进度:</p>
            <el-progress
              :percentage="Math.round((batchDownloadStatus.filter(s => s === 'completed').length / totalBatchCount) * 100)"
              :format="(percentage) => `${percentage}%`"
              :stroke-width="15"
              status="success"
              style="margin: 10px 0;"
            />
          </div>
        </div>
        <!-- 单文件下载进度（非批量下载时显示） -->
        <div v-else>
          <el-progress
            :percentage="downloadProgress"
            :format="(percentage) => `${percentage}%`"
            :stroke-width="20"
            status="success"
            style="margin: 20px 0;"
          />
          <div style="display: flex; justify-content: space-between; font-size: 14px;">
            <span>已下载: {{ downloadedInfo }}</span>
            <span>速度: {{ downloadSpeed }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div style="text-align: right; padding-right: 20px;">
          <el-button 
            type="primary" 
            :disabled="downloadProgress < 100 && downloadProgress > 0 && batchDownloadStatus.filter(s => s === 'completed').length < totalBatchCount"
            @click="downloadDialogVisible = false"
          >
            完成
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
