<script setup lang="ts">
import type { ImagePage, ImageQuery } from '#/api/system/media/image';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  deleteImagesApi,
  handleDownloadImageApi,
  selectImagePageApi,
} from '#/api/system/media/image';
import { useCardHeight } from '#/hooks/useCardHeight';
import ImageFormDialog from '#/views/system/media/image/ImageFormDialog.vue';
import ImageUploadDialog from '#/views/system/media/image/ImageUploadDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";

defineOptions({
  name: 'Image',
  inheritAttrs: false,
});

// 加载状态
const loading = ref(false);

// 分页总记录数
const total = ref(0);

// 查询参数
const queryParams = reactive<ImageQuery>({
  page: 1,
  limit: 20,
});

// 查询表单
const queryForm = ref(ElForm);

const imageIds = ref<string[]>([]);

const imgPath = `${import.meta.env.VITE_GLOB_API_URL}`;

/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  imageIds.value = selection.map((item: any) => item.id);
}

// 分页列表数据
const imageTableData = ref<ImagePage[]>();

// 查询图片
function handleQuery() {
  loading.value = true;
  selectImagePageApi(queryParams)
    .then((data) => {
      imageTableData.value = data.list;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 重置查询
function resetQuery() {
  queryForm.value.resetFields();
  queryParams.imageName = '';
  queryParams.page = 1;
  handleQuery();
}

/**
 * 下载图片
 * @param fileName
 */
async function handleDownloadImage(row: ImagePage) {
  try {
    const id = row.id;
    const response = await handleDownloadImageApi(id);

    // 处理下载逻辑
    const url = window.URL.createObjectURL(new Blob([response.data]));
    // 创建隐藏的可下载链接元素
    const link = document.createElement('a');
    link.href = url;

    const imageName = row.imageName;
    link.download = imageName;

    link.click();
    window.URL.revokeObjectURL(url);
  } catch {
    ElMessage.error('图片下载失败，请稍后再试!');
  }
}

/**
 * 删除图片
 * @param id
 */
function handleDeleteImage(id?: string) {
  let ids: string[];
  if (id) {
    ids = [String(id)]; // 删除单条记录
  } else if (imageIds.value.length > 0) {
    ids = imageIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项！');
    return;
  }

  ElMessageBox.confirm('确定删除图片?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteImagesApi(ids).then(() => {
      ElMessage.success('删除成功!');
      resetQuery();
    });
  });
}

onMounted(() => {
  handleQuery();
});

const { tableHeight } = useTableHeight(queryForm);

// 图片表单子组件
const imageFormDialogRef = ref();
function openImageFormDialog(id?: string) {
  imageFormDialogRef.value.openDialog(id);
}

// 上传文件子组件
const uploadDialogRef = ref();
function openUploadDialog() {
  uploadDialogRef.value.openUploadDialog();
}
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
            v-model="queryParams.imageName"
            placeholder="请输入图片名称"
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
            :disabled="imageIds.length === 0"
            @click="handleDeleteImage()"
            v-access:code="['sys:image:delete']"
          >
            <template #icon>
              <el-icon><Delete /></el-icon>
            </template>
            删除
          </el-button>

          <el-button
            type="primary"
            v-access:code="['sys:image:upload']"
            @click="openUploadDialog()"
          >
            <el-icon><Upload /></el-icon>上传图片
          </el-button>
        </el-form-item>
      </ElForm>

      <el-table
        v-loading="loading"
        :data="imageTableData"
        border
        :height="tableHeight"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="false" prop="id" />
        <el-table-column v-if="false" prop="storagePath" />

        <el-table-column type="selection" width="80" align="center" />

        <el-table-column type="index" label="序号" width="80" align="center" />

        <el-table-column prop="imageName" label="图片名称" align="center" />

        <el-table-column label="图片" prop="url" align="center">
          <template #default="scope">
            <el-image
              :src="imgPath + scope.row.url"
              style="width: 100px; height: 100px"
            />
          </template>
        </el-table-column>

        <el-table-column prop="imageSize" label="图片大小" align="center" />

        <el-table-column
          prop="createTime"
          label="图片上传时间"
          align="center"
        />

        <!-- @click="handlePreviewFile(scope.row.id, scope.row.fileName)"  -->
        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:image:edit']"
              @click="openImageFormDialog(scope.row.id)"
            >
              编辑
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:image:download']"
              @click="handleDownloadImage(scope.row)"
            >
              下载
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:image:delete']"
              @click="handleDeleteImage(scope.row.id)"
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

      <!-- 编辑图片弹框 -->
      <ImageFormDialog ref="imageFormDialogRef" @success="resetQuery" />

      <!-- 上传图片弹框 -->
      <ImageUploadDialog ref="uploadDialogRef" @success="resetQuery" />
  </div>
</template>
