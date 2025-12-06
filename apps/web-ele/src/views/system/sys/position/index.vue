<script setup lang="ts">
import type { PositionQuery, PositionVO } from '#/api/system/sys/position';

import { onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import { deptOptionTreeApi } from '#/api/system/sys/dept';
import {
  deletePositionApi,
  selectPositionPageApi,
} from '#/api/system/sys/position';
import { useCardHeight } from '#/hooks/useCardHeight';
import PositionFormDialog from '#/views/system/sys/position/PositionFormDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";

defineOptions({
  name: 'Position',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const loading = ref(false);

const positionIds = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<PositionQuery>({
  page: 1,
  limit: 20,
});

const positionTableData = ref<PositionVO[]>();

// 组织下拉选项树数据
const deptTreeOptionData = ref<OptionType[]>([]);


/**
 * 行 checkbox 选中事件
 * @param selection
 */
function handleSelectionChange(selection: any) {
  // 多选
  positionIds.value = selection.map((item: any) => item.positionId);
}

// 新增、编辑弹窗子组件
const formDialogRef = ref();
function openDialog(positionId?: string) {
  formDialogRef.value.openDialog(positionId, deptTreeOptionData.value);
}

/**
 * 查询
 */
function handleQuery() {
  loading.value = true;
  selectPositionPageApi(queryParams)
    .then((data) => {
      positionTableData.value = data.list;
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
  queryFormRef.value.resetFields();
  queryParams.page = 1;
  handleQuery();
}

/**
 * 删除岗位
 * @param positionId
 */
function handleDelete(positionId?: string) {
  let ids: string[];
  if (positionId) {
    ids = [String(positionId)]; // 删除单条记录
  } else if (positionIds.value.length > 0) {
    ids = positionIds.value; // 删除多条记录
  } else {
    ElMessage.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  ElMessageBox.confirm('确定删除已选中的数据项', '警告', {
    cancelButtonText: '取消',
    confirmButtonText: '确定',
    type: 'warning',
  }).then(() => {
    loading.value = true;
    deletePositionApi(ids)
      .then(() => {
        ElMessage.success('删除成功');
        resetQuery();
      })
      .finally(() => {
        loading.value = false;
      });
  });
}

// 获取部门下拉选项
async function deptTreeOptions() {
  deptTreeOptionData.value = await deptOptionTreeApi();
}

onMounted(() => {
  handleQuery();
  deptTreeOptions();
});

const { tableHeight } = useTableHeight(queryFormRef);
</script>

<template>
  <div class="app-container">
      <ElForm
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        @submit.prevent="handleQuery()"
      >
        <el-form-item prop="positionName">
          <el-input
            v-model="queryParams.positionName"
            placeholder="请输入岗位名称"
            clearable
            style="width: 240px"
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
            v-access:code="['sys:position:add']"
            @click="openDialog()"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增
          </el-button>

          <el-button
            type="danger"
            :disabled="positionIds.length === 0"
            v-access:code="['sys:position:delete']"
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
        :data="positionTableData"
        highlight-current-row
        border
        :height="tableHeight"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="80" align="center" />
        <el-table-column type="index" width="80" align="center" label="序号" />

        <el-table-column
          label="岗位名称"
          prop="positionName"
          width="200"
          align="center"
        />

        <el-table-column
          label="所属部门"
          prop="deptName"
          width="200"
          align="center"
        />

        <el-table-column label="状态" prop="status" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序" prop="sort" width="100" align="center" />

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
              v-access:code="['sys:position:edit']"
              @click="openDialog(scope.row.positionId)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              type="primary"
              size="small"
              link
              v-access:code="['sys:position:delete']"
              @click="handleDelete(scope.row.positionId)"
            >
              <el-icon><Delete /></el-icon>删除
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
    <PositionFormDialog ref="formDialogRef" @success="resetQuery" />
  </div>
</template>
