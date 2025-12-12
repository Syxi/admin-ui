<script setup lang="ts">
import type { DeptQuery, DeptVO } from '#/api/system/sys/dept';

import { nextTick, onMounted, reactive, ref } from 'vue';

import { ElForm, ElMessage, ElMessageBox } from 'element-plus';
import { Expand, Fold } from '@element-plus/icons-vue';

import {
  deleteDeptApi,
  deptOptionTreeApi,
  orgTreeApi,
} from '#/api/system/sys/dept';
import { useCardHeight } from '#/hooks/useCardHeight';
import DeptFormDialog from '#/views/system/sys/dept/DeptFormDialog.vue';
import {useTableHeight} from "#/hooks/useTableHeight";

// 查询表单
const queryFormRef = ref(ElForm);

// 查询参数
const queryParams = reactive<DeptQuery>({});

// 组织下拉选项树数据
const deptTreeOptionData = ref<OptionType[]>([]);

// 组织树数据
const deptTableData = ref<DeptVO[]>([]);

// 加载状态
const loading = ref(false);

// 表格引用
const tableRef = ref();

// 控制表格展开状态的响应式变量，默认值为 true（全部展开）
const isAllExpanded = ref(true);

// 切换表格展开状态
function toggleExpandAll() {
  isAllExpanded.value = !isAllExpanded.value;
  // 使用nextTick确保DOM更新后再执行展开/收缩操作
  nextTick(() => {
    setAllRowsExpansion(isAllExpanded.value);
  });
}

// 设置所有行的展开状态
function setAllRowsExpansion(expanded) {
  if (tableRef.value) {
    const expandAll = (data) => {
      data.forEach(item => {
        tableRef.value.toggleRowExpansion(item, expanded);
        if (item.children && item.children.length > 0) {
          expandAll(item.children);
        }
      });
    };
    expandAll(deptTableData.value);
  }
}

const deptFormDialogRef = ref();
function openDialog(id?: string, parentId?: string) {
  deptFormDialogRef.value.openDialog(id, parentId, deptTreeOptionData.value);
}

/**
 * 查询机构树
 */
function handleQuery() {
  loading.value = true;
  orgTreeApi(queryParams)
    .then((data) => {
      deptTableData.value = data;
      // 数据加载完成后，根据isAllExpanded的状态设置展开状态
      nextTick(() => {
        setAllRowsExpansion(isAllExpanded.value);
      });
    })
    .finally(() => {
      loading.value = false;
    });
}

// 重置查询
function resetQuery() {
  queryFormRef.value.resetFields();
  queryParams.keyWord = undefined;
  handleQuery();
}

/**
 * 删除机构或部门
 * @param id
 */
function handleDelete(id?: string) {
  if (id) {
    ElMessageBox.confirm('确定删除已选中的数据项?', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        deleteDeptApi(id).then(() => {
          ElMessage.success('删除成功!');
          handleQuery();
          OrgOptionTree();
        });
      })
      .catch(() => {
        ElMessage.info('已取消删除!');
      });
  }
}

/**
 * 组织机构部门下拉树
 */
async function OrgOptionTree() {
  const data = await deptOptionTreeApi();
  // 添加顶级根节点
  deptTreeOptionData.value = [
    {
      value: '0',
      label: '顶级机构',
      children: data
    }
  ];
}

onMounted(() => {
  handleQuery();
  OrgOptionTree();
});

const { tableHeight } = useTableHeight(queryFormRef, { tableOffset: -30 });
</script>

<template>
  <div class="app-container">
      <ElForm
        ref="queryFormRef"
        :inline="true"
        :model="queryParams"
        class="mb-2"
        @submit.prevent="handleQuery()"
      >
        <el-form-item prop="keyWord">
          <el-input
            placeholder="机构名称"
            clearable
            style="width: 240px"
            v-model="queryParams.keyWord"
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
            type="primary"
            @click="openDialog(undefined, '0')"
            v-access:code="['sys:dept:add']"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增机构
          </el-button>

          <!-- 控制表格展开/收缩的按钮 -->
          <el-button @click="toggleExpandAll" type="primary">
            <template #icon>
              <el-icon>
                <ArrowDown v-if="!isAllExpanded" /><ArrowUp v-else />
              </el-icon>
            </template>
            {{ isAllExpanded ? '收起全部' : '展开全部' }}
          </el-button>
        </el-form-item>
      </ElForm>

      <el-table
        ref="tableRef"
        border
        :data="deptTableData"
        v-loading="loading"
        row-key="id"
        :default-expand-all="isAllExpanded"
        highlight-current-row
        :height="tableHeight"
      >
        <!-- <el-table-column
          v-if="false"
          prop="id"
        />

        <el-table-column
          v-if="false"
          prop="deptId"
        />

        <el-table-column
          v-if="false"
          prop="parentId"
        /> -->

        <el-table-column label="名称" prop="deptName" align="left" />

        <el-table-column
          label="类型"
          prop="deptType"
          align="center"
          width="100"
        >
          <template #default="scope">
            <el-tag v-if="scope.row.deptType === 1" type="primary">
              机构
            </el-tag>
            <el-tag v-else type="success">部门</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="编码"
          prop="deptCode"
          align="center"
          width="120"
        />

        <el-table-column label="排序" prop="sort" align="center" width="80" />

        <el-table-column label="状态" align="center" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success"> 显示 </el-tag>
            <el-tag v-else type="info">隐藏</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="创建时间"
          prop="createTime"
          align="center"
          width="200"
        />

        <el-table-column align="center" label="操作">
          <template #default="scope">
            <!--            <el-button
              v-if="scope.row.deptType === 1"
              type="primary"
              link
              size="small"
              v-access:code="['sys:dept:add']"
              @click="openDialog(undefined, scope.row.parentId)"
            >
              <el-icon><Plus /></el-icon>
              新增
            </el-button>-->

            <el-button
              type="primary"
              link
              size="small"
              v-access:code="['sys:dept:edit']"
              @click="openDialog(scope.row.id, scope.row.parentId)"
            >
              <el-icon><Edit /></el-icon> 编辑
            </el-button>

            <el-button
              type="primary"
              link
              size="small"
              v-access:code="['sys:dept:delete']"
              @click="handleDelete(scope.row.id)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

    <DeptFormDialog ref="deptFormDialogRef" @success="handleQuery" />
  </div>
</template>
