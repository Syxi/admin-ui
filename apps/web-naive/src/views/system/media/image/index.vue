<script setup lang="ts">
import type { ImagePage, ImageQuery } from '#/api/system/media/image';

import { h, onMounted, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NButton, NDataTable, NPagination, NIcon, NSpace, NImage } from 'naive-ui';
import { message, dialog } from '#/hooks';

import {
  deleteImagesApi,
  handleDownloadImageApi,
  selectImagePageApi,
} from '#/api/system/media/image';
import { useCardHeight } from '#/hooks/useCardHeight';
import ImageFormDialog from '#/views/system/media/image/ImageFormDialog.vue';
import ImageUploadDialog from '#/views/system/media/image/ImageUploadDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";
import { Search, Refresh, Delete, Upload } from '@vben/icons';

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
const queryForm = ref();

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
  queryForm.value?.restoreValidation();
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
    message.error('图片下载失败，请稍后再试!');
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
    message.warning('请勾选删除项！');
    return;
  }

  dialog.warning({
    title: '警告',
    content: '确定删除图片?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      deleteImagesApi(ids).then(() => {
        message.success('删除成功!');
        resetQuery();
      });
    }
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
      <NForm
        :model="queryParams"
        ref="queryForm"
        :inline="true"
        @submit.prevent
      >
        <NFormItem>
          <NInput
            v-model:value="queryParams.imageName"
            placeholder="请输入图片名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery()"
          />
        </NFormItem>

        <NFormItem>
          <NButton type="primary" @click="handleQuery()">
            <template #icon>
              <NIcon><Search /></NIcon>
            </template>
            搜索
          </NButton>

          <NButton type="primary" @click="resetQuery()">
            <template #icon>
              <NIcon><Refresh /></NIcon>
            </template>
            重置
          </NButton>

          <NButton
            type="error"
            :disabled="imageIds.length === 0"
            @click="handleDeleteImage()"
            v-access:code="['sys:image:delete']"
          >
            <template #icon>
              <NIcon><Delete /></NIcon>
            </template>
            删除
          </NButton>

          <NButton
            type="primary"
            v-access:code="['sys:image:upload']"
            @click="openUploadDialog()"
          >
            <NIcon><Upload /></NIcon>上传图片
          </NButton>
        </NFormItem>
      </NForm>

      <NDataTable
        v-model:checked-row-keys="imageIds"
        :loading="loading"
        :data="imageTableData"
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
            title: '图片名称',
            key: 'imageName',
            align: 'center'
          },
          {
            title: '图片',
            key: 'url',
            align: 'center',
            render: (row) => h(NImage, {
              src: imgPath + row.url,
              style: 'width: 100px; height: 100px'
            })
          },
          {
            title: '图片大小',
            key: 'imageSize',
            align: 'center'
          },
          {
            title: '图片上传时间',
            key: 'createTime',
            align: 'center'
          },
          {
            title: '操作',
            key: 'actions',
            align: 'center',
            width: 200,
            render: (row) => {
              return h(NSpace, null, {
                default: () => [
                  h(NButton, {
                    type: 'primary',
                    size: 'small',
                    quaternary: true,
                    onClick: () => openImageFormDialog(row.id)
                  }, { default: () => '编辑' }),
                  h(NButton, {
                    type: 'primary',
                    size: 'small',
                    quaternary: true,
                    onClick: () => handleDownloadImage(row)
                  }, { default: () => '下载' }),
                  h(NButton, {
                    type: 'error',
                    size: 'small',
                    quaternary: true,
                    onClick: () => handleDeleteImage(row.id)
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

      <!-- 编辑图片弹框 -->
      <ImageFormDialog ref="imageFormDialogRef" @success="resetQuery" />

      <!-- 上传图片弹框 -->
      <ImageUploadDialog ref="uploadDialogRef" @success="resetQuery" />
  </div>
</template>