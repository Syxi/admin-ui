<template>
  <div class="app-container">
    <n-layout class="media-library-container" has-sider>
      <!-- 左侧文件树 -->
      <n-layout-sider width="260" class="media-tree-aside" :collapsed="false" collapse-mode="transform" bordered>
        <n-card class="media-tree-card" header-style="padding: 10px;" content-style="padding: 0;">
          <template #header>
            <div class="card-header">
              <span>文件分类</span>
            </div>
          </template>
          
          <n-input
            v-model:value="treeFilterText"
            placeholder="输入关键字进行过滤"
            clearable
            size="small"
            class="mb-3"
          >
            <template #prefix>
              <n-icon><Search /></n-icon>
            </template>
          </n-input>
          
          <n-tree
            ref="treeRef"
            :data="treeData"
            :children-field="'children'"
            :label-field="'label'"
            :key-field="'id'"
            :filter="(pattern, node) => filterNode(pattern, node)"
            :expand-on-click="false"
            @click="handleTreeNodeClick"
            block-line
            class="media-tree"
            default-expand-all
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <n-icon class="tree-node-icon">
                  <Folder v-if="data.type === 'folder'" />
                  <Picture v-else-if="data.type === 'image'" />
                  <VideoCamera v-else-if="data.type === 'video'" />
                  <Document v-else />
                </n-icon>
                <span class="tree-node-label">{{ node.label }}</span>
                <n-tag v-if="data.count !== undefined" size="small" type="info" class="tree-node-count">
                  {{ data.count }}
                </n-tag>
              </div>
            </template>
          </n-tree>
        </n-card>
      </n-layout-sider>
      
      <!-- 右侧内容区 -->
      <n-layout class="media-content-main" content-style="padding: 0 10px;">
        <!-- 查询表单 -->
        <n-form :model="queryParams" ref="queryForm" :inline="true" @submit.prevent="handleQuery">
          <!-- 媒体类型筛选 -->
          <n-form-item label="媒体类型">
            <n-select v-model:value="queryParams.mediaType" placeholder="请选择媒体类型" clearable style="width: 180px">
              <n-option label="全部" value="" />
              <n-option label="文件" value="file" />
              <n-option label="图片" value="image" />
              <n-option label="视频" value="video" />
            </n-select>
          </n-form-item>

          <!-- 文件名搜索 -->
          <n-form-item>
            <n-input
              v-model:value="queryParams.fileName"
              :placeholder="getPlaceholderByType"
              clearable
              style="width: 240px"
              @keyup.enter="handleQuery()"
            />
          </n-form-item>

          <n-form-item>
            <n-button attr-type="button" type="primary" @click="handleQuery()">
              <template #icon>
                <n-icon><Search /></n-icon>
              </template>
              搜索
            </n-button>

            <n-button attr-type="button" type="primary" @click="resetQuery()">
              <template #icon>
                <n-icon><Refresh /></n-icon>
              </template>
              重置
            </n-button>

            <n-button
              attr-type="button"
              type="error"
              :disabled="selectedIds.length === 0"
              @click="handleDelete()"
              v-access:code="['sys:media:delete']"
            >
              <template #icon>
                <n-icon><Delete /></n-icon>
              </template>
              删除
            </n-button>

            <n-button
              attr-type="button"
              type="primary"
              v-access:code="['sys:media:upload']"
              @click="openUploadDialog()"
            >
              <template #icon>
                <n-icon><Upload /></n-icon>
              </template>
              上传媒体
            </n-button>
            
            <!-- 视图切换按钮 -->
            <n-button-group class="view-toggle-group">
              <n-button
                :type="viewMode === 'list' ? 'primary' : 'default'"
                @click="changeViewMode('list')"
                v-access:code="['sys:media:view:list']"
              >
                <n-icon><List /></n-icon>
              </n-button>
              <n-button
                :type="viewMode === 'grid' ? 'primary' : 'default'"
                @click="changeViewMode('grid')"
                v-access:code="['sys:media:view:grid']"
              >
                <n-icon><Grid /></n-icon>
              </n-button>
            </n-button-group>
          </n-form-item>
        </n-form>
        
        <!-- 媒体列表/网格视图 -->
        <div class="media-content">
          <!-- 列表视图 -->
          <n-data-table
            v-if="viewMode === 'list'"
            :data="mediaTableData"
            :columns="tableColumns"
            
            :pagination="pagination"
            :row-key="(row) => row.id"
            :scroll-x="1200"
            @update-checked-row-keys="handleSelectionChange"
            flex-height
            :style="{ height: `${tableHeight}px` }"
          />
          
          <!-- 网格视图 -->
          <div v-else class="media-grid-container">
            <div class="media-grid">
              <div 
                v-for="item in mediaTableData" 
                :key="item.id" 
                class="media-grid-item"
                @click="handleGridItemClick(item)"
              >
                <div class="media-thumb">
                  <n-image
                    v-if="isImage(item.fileType)"
                    :src="getImageUrl(item.url)"
                    class="media-image"
                    :preview-disabled="false"
                    :img-props="{ style: 'width: 100%; height: 100%; object-fit: cover;' }"
                    @click="handlePreview(item)"
                  />
                  <div v-else-if="isVideo(item.fileType)" class="media-video">
                    <n-icon class="video-icon"><VideoCamera /></n-icon>
                  </div>
                  <div v-else class="media-file">
                    <n-icon class="file-icon"><Document /></n-icon>
                  </div>
                </div>
                <div class="media-info">
                  <div class="media-name" :title="item.fileName">{{ item.fileName }}</div>
                  <div class="media-meta">
                    <span class="media-size">{{ item.fileSize }}</span>
                    <span class="media-time">{{ formatDate(item.createTime) }}</span>
                  </div>
                </div>
                <div class="media-actions">
                  <n-button 
                    type="primary" 
                    size="small" 
                    quaternary 
                    @click.stop="handlePreview(item)"
                    v-access:code="['sys:media:preview']"
                  >
                    预览
                  </n-button>
                  <n-button 
                    type="primary" 
                    size="small" 
                    quaternary 
                    @click.stop="handleDownload(item)"
                    v-access:code="['sys:media:download']"
                  >
                    下载
                  </n-button>
                  <n-button 
                    type="primary" 
                    size="small" 
                    quaternary 
                    @click.stop="handleDelete(item.id)"
                    v-access:code="['sys:media:delete']"
                  >
                    删除
                  </n-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="total > 0" class="pagination-container" style="margin-top: 16px;">
          <n-space justify="center">
            <n-pagination
              v-model:page="queryParams.page"
              v-model:page-size="queryParams.limit"
              :item-count="total"
              :page-sizes="[
                { label: '10/页', value: 10 },
                { label: '20/页', value: 20 },
                { label: '30/页', value: 30 },
                { label: '50/页', value: 50 },
                { label: '100/页', value: 100 }
              ]"
              @update-page="handleQuery"
              @update-page-size="handleQuery"
              show-size-picker
              show-quick-jumper
            />
          </n-space>
        </div>
      </n-layout>
    </n-layout>

    <!-- 上传文件弹窗 -->
    <MediaUploadDialog ref="uploadDialogRef" @success="handleQuery" />

    <!-- 图片编辑弹窗 -->
    <ImageFormDialog ref="imageFormDialogRef" @success="handleQuery" />

    <!-- 视频播放弹窗 -->
    <VideoPlayerDialog ref="videoPlayerDialogRef" />

    <!-- PDF预览弹窗 -->
    <PdfViewDialog ref="pdfPreviewDialogRef" />
  </div>
</template>

<script setup lang="ts">
import type { FileRecordVO, FileRecordQuery } from '#/api/system/media/file';
import type { ImageQuery } from '#/api/system/media/image';
import type { VideoQuery } from '#/api/system/media/video';
import { onMounted, reactive, ref, computed, watch, h } from 'vue';
import { 
  NLayout,
  NLayoutSider,
  NCard,
  NInput,
  NIcon,
  NTree,
  NForm,
  NFormItem,
  NSelect,
  NOption,
  NButton,
  NButtonGroup,
  NDataTable,
  NTag,
  NImage,
  NSpace,
  NPagination,
  useMessage,
  useDialog
} from 'naive-ui';

import {
  deleteFileApi,
  handleDownloadSourceFileApi,
  selectFilePageApi,
} from '#/api/system/media/file';
import {
  handleDownloadImageApi,
  selectImagePageApi,
  deleteImagesApi,  // 添加回来，因为我们可能需要根据类型来调用不同的删除API
} from '#/api/system/media/image';
import {
  downloadVideoApi,
  selectVideosPageApi,
  deleteVideoApi,  // 添加回来，因为我们可能需要根据类型来调用不同的删除API
} from '#/api/system/media/video';

import { useTableHeight } from '#/hooks/useTableHeight';
import MediaUploadDialog from '#/views/system/media/MediaUploadDialog.vue';
import ImageFormDialog from '#/views/system/media/image/ImageFormDialog.vue';
import VideoPlayerDialog from '#/views/system/media/video/VideoPlayerDialog.vue';
import PdfViewDialog from '#/views/system/media/file/PdfViewDialog.vue';

defineOptions({
  name: 'MediaLibrary',
  inheritAttrs: false,
});

// 统一的媒体类型接口
interface MediaItem {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  url: string;
  createTime: Date;
  updateTime: Date;
  // 用于区分是文件、图片还是视频
  mediaType: 'file' | 'image' | 'video';
  // 图片特有的字段
  imageName?: string;
  imageMd5?: string;
  imageType?: string;
  storagePath?: string;
  // 视频特有的字段
  filePath?: string;
  description?: string;
  remark?: string;
  // FileRecordVO 特有的字段
  fileMd5?: string;
  fileDescription?: string;
  fileStoragePath?: string;
  pdfStoragePath?: string;
}

// 树节点接口
interface TreeNode {
  id: string;
  label: string;
  type: 'folder' | 'image' | 'video' | 'file';
  count?: number;
  children?: TreeNode[];
}

// 加载状态
const loading = ref(false);

// 分页总记录数
const total = ref(0);

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 20,
  fileName: '',
  mediaType: '', // 'file', 'image', 'video' or empty for all
});

// 查询表单
const queryForm = ref();
const message = useMessage();
const dialog = useDialog();

// 分页列表数据
const mediaTableData = ref<MediaItem[]>([]);

const selectedIds = ref<string[]>([]);

// 组件引用
const uploadDialogRef = ref();
const imageFormDialogRef = ref();
const videoPlayerDialogRef = ref();
const pdfPreviewDialogRef = ref();

// 文件树相关
const treeRef = ref();
const treeFilterText = ref('');
const treeData = ref<TreeNode[]>([
  {
    id: 'all',
    label: '全部文件',
    type: 'folder',
    count: 0,
    children: [
      { id: 'image', label: '图片', type: 'folder', count: 0 },
      { id: 'video', label: '视频', type: 'folder', count: 0 },
      { id: 'file', label: '文档', type: 'folder', count: 0 },
    ]
  }
]);

const treeProps = {
  children: 'children',
  label: 'label'
};

// 视图模式：'list' 或 'grid'
const viewMode = ref<'list' | 'grid'>('list');

const { tableHeight } = useTableHeight(queryForm);

// 根据媒体类型显示不同的placeholder
const getPlaceholderByType = computed(() => {
  if (queryParams.mediaType === 'image') {
    return '请输入图片名称';
  } else if (queryParams.mediaType === 'video') {
    return '请输入视频名称';
  } else {
    return '请输入文件名';
  }
});

// 监听树过滤文本变化
watch(treeFilterText, (val) => {
  treeRef.value!.filter(val);
});

/**
 * 过滤树节点
 */
const filterNode = (value: string, data: TreeNode) => {
  if (!value) return true;
  return data.label.toLowerCase().includes(value.toLowerCase());
};

/**
 * 处理树节点点击
 */
function handleTreeNodeClick(data: TreeNode) {
  // 根据节点类型设置媒体类型筛选
  if (data.type === 'folder') {
    if (data.id === 'image') {
      queryParams.mediaType = 'image';
    } else if (data.id === 'video') {
      queryParams.mediaType = 'video';
    } else if (data.id === 'file') {
      queryParams.mediaType = 'file';
    } else if (data.id === 'all') {
      queryParams.mediaType = '';
    }
    handleQuery();
  }
}

/**
 * 切换视图模式
 */
function changeViewMode(mode: 'list' | 'grid') {
  viewMode.value = mode;
}

/**
 * 格式化日期
 */
function formatDate(date: Date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 处理网格项目点击
 */
function handleGridItemClick(item: MediaItem) {
  // 选中项目
  console.log('点击项目:', item);
}

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  selectedIds.value = selection.map((item: any) => item.id);
}

// 查询媒体文件
async function handleQuery() {
  loading.value = true;

  try {
    let response;
    
    // 根据媒体类型调用不同的API
    if (queryParams.mediaType === 'image') {
      const imageQuery: ImageQuery = {
        page: queryParams.page,
        limit: queryParams.limit,
        imageName: queryParams.fileName,
      };
      response = await selectImagePageApi(imageQuery);
      
      // 转换图片数据为统一格式
      mediaTableData.value = response.list.map(item => ({
        id: item.id,
        fileName: item.imageName,
        fileSize: item.imageSize,
        fileType: item.imageType,
        url: item.url,
        createTime: item.createTime,
        updateTime: item.updateTime,
        mediaType: 'image',
        imageName: item.imageName,
        imageMd5: item.imageMd5,
        imageType: item.imageType,
        storagePath: item.storagePath,
      }));
    } else if (queryParams.mediaType === 'video') {
      const videoQuery: VideoQuery = {
        page: queryParams.page,
        limit: queryParams.limit,
        fileName: queryParams.fileName,
      };
      response = await selectVideosPageApi(videoQuery);
      
      // 转换视频数据为统一格式
      mediaTableData.value = response.list.map(item => ({
        id: item.id || '',
        fileName: item.fileName || '',
        fileSize: '', // 视频API中没有文件大小字段
        fileType: (item.fileName || '').split('.').pop() || '', // 从文件名获取扩展名
        url: item.url,
        createTime: item.createTime || new Date(),
        updateTime: item.updateTime || new Date(),
        mediaType: 'video',
        filePath: item.filePath,
        description: item.description,
        remark: item.remark,
      }));
    } else {
      // 默认查询所有文件
      const fileQuery: FileRecordQuery = {
        page: queryParams.page,
        limit: queryParams.limit,
        fileName: queryParams.fileName,
      };
      response = await selectFilePageApi(fileQuery);
      
      // 转换文件数据为统一格式
      mediaTableData.value = response.list.map(item => ({
        id: item.id,
        fileName: item.fileName,
        fileSize: String(item.fileSize),
        fileType: item.fileType,
        url: item.url,
        createTime: item.createTime,
        updateTime: item.updateTime,
        mediaType: 'file',
        fileMd5: item.fileMd5,
        fileDescription: item.fileDescription,
        fileStoragePath: item.fileStoragePath,
        pdfStoragePath: item.pdfStoragePath,
      }));
    }

    total.value = response.total;
  } catch (error) {
    console.error('查询媒体文件失败:', error);
    message.error('查询媒体文件失败');
  } finally {
    loading.value = false;
  }
}

// 重置查询
function resetQuery() {
  queryForm.value?.resetFields();
  queryParams.fileName = '';
  queryParams.mediaType = '';
  queryParams.page = 1;
  handleQuery();
}

/**
 * 删除媒体文件
 * @param id
 */
async function handleDelete(id?: string) {
  let ids: string[];
  if (id) {
    ids = [String(id)]; // 删除单条记录
  } else if (selectedIds.value.length > 0) {
    ids = selectedIds.value; // 删除多条记录
  } else {
    message.warning('请勾选删除项！');
    return;
  }

  dialog.warning({
    title: '警告',
    content: '确定删除选中的媒体文件?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
    try {
      // 根据文件类型调用不同的删除API
      const itemsToDelete = mediaTableData.value.filter(item => ids.includes(item.id));
      const mediaTypes = [...new Set(itemsToDelete.map(item => item.mediaType))];
      
      if (mediaTypes.length === 1) {
        // 如果只有一种类型，调用对应类型的删除API
        const type = mediaTypes[0];
        if (type === 'image') {
          await deleteImagesApi(ids);
        } else if (type === 'video') {
          await deleteVideoApi(ids);
        } else {
          await deleteFileApi(ids);
        }
      } else {
        // 如果有多种类型，按类型分组删除
        const images = itemsToDelete.filter(item => item.mediaType === 'image');
        const videos = itemsToDelete.filter(item => item.mediaType === 'video');
        const files = itemsToDelete.filter(item => item.mediaType === 'file');
        
        const promises = [];
        if (images.length > 0) {
          promises.push(deleteImagesApi(images.map(item => item.id)));
        }
        if (videos.length > 0) {
          promises.push(deleteVideoApi(videos.map(item => item.id)));
        }
        if (files.length > 0) {
          promises.push(deleteFileApi(files.map(item => item.id)));
        }
        
        await Promise.all(promises);
      }
      
      message.success('删除成功!');
      handleQuery();
    } catch (error) {
      message.error('删除失败!');
      console.error('删除媒体文件失败:', error);
    }
  });
}

/**
 * 下载文件
 * @param row
 */
async function handleDownload(row: MediaItem) {
  try {
    let response;
    
    if (row.mediaType === 'image') {
      response = await handleDownloadImageApi(row.id);
    } else if (row.mediaType === 'video') {
      response = await downloadVideoApi(row.fileName);
    } else {
      response = await handleDownloadSourceFileApi(row.id);
    }

    // 处理下载逻辑
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = row.fileName;

    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('文件下载失败:', error);
    message.error('文件下载失败，请稍后再试!');
  }
}

/**
 * 预览文件
 * @param row
 */
function handlePreview(row: MediaItem) {
  if (row.mediaType === 'image') {
    // 图片预览通过el-image组件的preview-src-list实现
    console.log('图片预览:', row.url);
  } else if (row.mediaType === 'video') {
    playVideo(row.fileName, row.url);
  } else {
    // 文件预览，如果是PDF则使用PDF预览组件
    if (row.fileName.toLowerCase().endsWith('.pdf')) {
      // 将 MediaItem 转换为 FileRecordVO
      const fileRecordVO: FileRecordVO = {
        id: row.id,
        fileName: row.fileName,
        fileSize: typeof row.fileSize === 'number' ? row.fileSize : parseInt(row.fileSize) || 0,
        fileType: row.fileType,
        url: row.url,
        createTime: row.createTime,
        updateTime: row.updateTime,
        fileMd5: row.fileMd5 || '',
        fileDescription: row.fileDescription || '',
        fileStoragePath: row.fileStoragePath || '',
        pdfStoragePath: row.pdfStoragePath || '',
      };
      pdfPreviewDialogRef.value.handlePreviewFile(fileRecordVO);
    } else {
      message.warning('该文件类型不支持在线预览');
    }
  }
}

/**
 * 播放视频
 */
function playVideo(fileName: string, url: string) {
  videoPlayerDialogRef.value.handlePlayVideo(fileName, url);
}

/**
 * 打开图片编辑对话框
 */
function openImageFormDialog(id?: string) {
  if (id) {
    imageFormDialogRef.value.openDialog(id);
  }
}

/**
 * 打开上传对话框
 */
function openUploadDialog() {
  uploadDialogRef.value.openDialog();
}

/**
 * 判断是否为图片类型
 */
function isImage(fileType: string): boolean {
  if (!fileType) return false;
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'];
  return imageTypes.some(type => fileType.toLowerCase().includes(type.toLowerCase()));
}

/**
 * 判断是否为视频类型
 */
function isVideo(fileType: string): boolean {
  if (!fileType) return false;
  const videoTypes = ['video/', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mkv'];
  return videoTypes.some(type => fileType.toLowerCase().includes(type.toLowerCase()));
}

/**
 * 获取图片URL
 */
function getImageUrl(url: string): string {
  if (url.startsWith('http')) {
    return url;
  }
  return `${import.meta.env.VITE_GLOB_API_URL}${url}`;
}

onMounted(() => {
  handleQuery();
});
</script>

<style scoped>
.media-library-container {
  height: 100%;
}

.media-tree-aside {
  height: calc(100vh - 120px);
}

.media-tree-card {
  height: 100%;
}

.media-tree {
  height: calc(100% - 60px);
  overflow: auto;
}

.card-header {
  font-weight: 600;
}

.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.tree-node-icon {
  margin-right: 8px;
  width: 20px;
}

.tree-node-count {
  margin-left: 8px;
}

.media-content-main {
  padding: 0 10px;
}

.media-content {
  min-height: calc(100vh - 250px);
}

.view-toggle-group {
  margin-left: 10px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #409eff;
}

.file-name {
  word-break: break-all;
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
}

.video-preview-icon {
  font-size: 24px;
  color: #f56c6c;
}

.file-preview-icon {
  font-size: 24px;
  color: #909399;
}

/* 网格视图样式 */
.media-grid-container {
  padding: 10px 0;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.media-grid-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.media-grid-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.media-thumb {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.media-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-video, .media-file {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-icon {
  font-size: 40px;
  color: #f56c6c;
}

.file-icon {
  font-size: 40px;
  color: #909399;
}

.media-info {
  margin-bottom: 8px;
}

.media-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.media-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.media-size {
  flex: 1;
}

.media-time {
  flex: 1;
  text-align: right;
}

.media-actions {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #e4e7ed;
  padding-top: 8px;
  margin-top: 8px;
}

.media-actions .n-button {
  padding: 2px 4px;
  font-size: 12px;
}
</style>

<script setup lang="ts">
// 表格列定义
const tableColumns = [
  {
    type: 'selection',
    align: 'center',
  },
  {
    title: '序号',
    key: 'index',
    width: 80,
    align: 'center',
    render: (row, index) => index + 1,
  },
  {
    title: '文件名称',
    key: 'fileName',
    align: 'center',
    width: 200,
    render: (row) => {
      return h('div', { class: 'file-info' }, [
        h('div', { class: 'file-icon' }, [
          isImage(row.fileType) ? h(NIcon, null, { default: () => h(Picture) }) :
          isVideo(row.fileType) ? h(NIcon, null, { default: () => h(VideoCamera) }) :
          h(NIcon, null, { default: () => h(Document) })
        ]),
        h('span', { class: 'file-name' }, row.fileName)
      ]);
    }
  },
  {
    title: '文件大小',
    key: 'fileSize',
    align: 'center',
    width: 120,
  },
  {
    title: '文件类型',
    key: 'fileType',
    align: 'center',
    width: 120,
  },
  {
    title: '预览',
    key: 'preview',
    align: 'center',
    width: 150,
    render: (row) => {
      if (isImage(row.fileType)) {
        return h('div', { class: 'preview-container' }, [
          h(NImage, {
            src: getImageUrl(row.url),
            style: 'width: 80px; height: 80px; object-fit: cover;',
            previewProps: {
              src: getImageUrl(row.url)
            }
          })
        ]);
      } else if (isVideo(row.fileType)) {
        return h('div', { class: 'preview-container' }, [
          h(NIcon, { class: 'video-preview-icon' }, { default: () => h(VideoCamera) })
        ]);
      } else {
        return h('div', { class: 'preview-container' }, [
          h(NIcon, { class: 'file-preview-icon' }, { default: () => h(Document) })
        ]);
      }
    }
  },
  {
    title: '上传时间',
    key: 'createTime',
    align: 'center',
    width: 180,
    render: (row) => row.createTime ? formatDateTime(row.createTime) : '-',
  },
  {
    title: '操作',
    key: 'actions',
    width: 300,
    align: 'center',
    render: (row) => {
      const buttons = [];
      
      // 图片操作
      if (isImage(row.fileType)) {
        buttons.push(
          h(NButton, {
            type: 'primary',
            size: 'small',
            quaternary: true,
            onClick: () => openImageFormDialog(row.id),
            vAccessCode: ['sys:image:edit']
          }, { default: () => '编辑' })
        );
      }
      
      // 视频操作
      if (isVideo(row.fileType)) {
        buttons.push(
          h(NButton, {
            type: 'primary',
            size: 'small',
            quaternary: true,
            onClick: () => playVideo(row.fileName, row.url),
            vAccessCode: ['sys:video:play']
          }, { default: () => '播放' })
        );
      }
      
      // 通用操作
      buttons.push(
        h(NButton, {
          type: 'primary',
          size: 'small',
          quaternary: true,
          onClick: () => handlePreview(row),
          vAccessCode: ['sys:media:preview']
        }, { default: () => '预览' }),
        
        h(NButton, {
          type: 'primary',
          size: 'small',
          quaternary: true,
          onClick: () => handleDownload(row),
          vAccessCode: ['sys:media:download']
        }, { default: () => '下载' }),
        
        h(NButton, {
          type: 'primary',
          size: 'small',
          quaternary: true,
          onClick: () => handleDelete(row.id),
          vAccessCode: ['sys:media:delete']
        }, { default: () => '删除' })
      );
      
      return h('div', { style: 'display: flex; justify-content: center; gap: 8px;' }, buttons);
    }
  }
];

const pagination = computed(() => ({
  page: queryParams.page,
  pageSize: queryParams.limit,
  itemCount: total.value,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 40, 50],
  onUpdatePage: (page: number) => {
    queryParams.page = page;
    handleQuery();
  },
  onUpdatePageSize: (pageSize: number) => {
    queryParams.limit = pageSize;
    handleQuery();
  }
}));
</script>