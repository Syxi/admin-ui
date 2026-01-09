<script setup lang="ts">
import type { DeptQuery, DeptVO } from '#/api/system/sys/dept';

import { nextTick, onMounted, reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NButton, NTable, NTag, useMessage } from 'naive-ui';
import { Icon } from '@iconify/vue';


import {
  deleteDeptApi,
  deptOptionTreeApi,
  orgTreeApi,
} from '#/api/system/sys/dept';
import DeptFormDialog from '#/views/system/sys/dept/DeptFormDialog.vue';

const message = useMessage();

// 查询表单
const queryFormRef = ref();

// 查询参数
const queryParams = reactive<DeptQuery>({});

// 组织下拉选项树数据
const deptTreeOptionData = ref<any[]>([]);

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
function setAllRowsExpansion(expanded: boolean) {
  if (tableRef.value) {
    const expandAll = (data: any[]) => {
      data.forEach((item: any) => {
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
    if (confirm('确定删除已选中的数据项?')) {
      deleteDeptApi(id).then(() => {
        message.success('删除成功!');
        handleQuery();
        OrgOptionTree();
      }).catch(() => {
        message.info('已取消删除!');
      });
    }
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


</script>

<template>
  <div class="app-container">
      <NForm
        ref="queryFormRef"
        :inline="true"
        :model="queryParams"
        class="mb-2"
        @submit.prevent="handleQuery()"
      >
        <NFormItem prop="keyWord">
          <NInput
            placeholder="机构名称"
            clearable
            style="width: 240px"
            v-model:value="queryParams.keyWord"
          />
        </NFormItem>

        <NFormItem>
          <NButton type="primary" @click="handleQuery()">
            <template #icon>
              <Icon icon="mdi:magnify" />
            </template>
            搜索
          </NButton>

          <NButton type="primary" @click="resetQuery()">
            重置
          </NButton>

          <NButton
            type="primary"
            @click="openDialog(undefined, '0')"
            v-access:code="['sys:dept:add']"
          >
            新增机构
          </NButton>

          <!-- 控制表格展开/收缩的按钮 -->
          <NButton @click="toggleExpandAll" type="primary">
            <template #icon>
              <Icon icon="mdi:arrow-down" v-if="!isAllExpanded" /><Icon icon="mdi:arrow-up" v-else />
            </template>
            {{ isAllExpanded ? '收起全部' : '展开全部' }}
          </NButton>
        </NFormItem>
      </NForm>

      <NTable
        ref="tableRef"
        :data="deptTableData"
        :bordered="true"
        :single-line="false"
        :loading="loading"
        :default-expand-all="isAllExpanded"
        :pagination="{
          pageSize: 999999, // 不分页，显示所有数据
        }"
      >
        <thead>
          <tr>
            <th>名称</th>
            <th style="width: 100px; text-align: center;">类型</th>
            <th style="width: 120px; text-align: center;">编码</th>
            <th style="width: 80px; text-align: center;">排序</th>
            <th style="width: 80px; text-align: center;">状态</th>
            <th style="width: 200px; text-align: center;">创建时间</th>
            <th style="width: 150px; text-align: center;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in deptTableData"
            :key="item.id"
          >
            <td>{{ item.deptName }}</td>
            <td style="text-align: center;">
              <NTag v-if="item.deptType === 1" type="primary">
                机构
              </NTag>
              <NTag v-else type="success">部门</NTag>
            </td>
            <td style="text-align: center;">{{ item.deptCode }}</td>
            <td style="text-align: center;">{{ item.sort }}</td>
            <td style="text-align: center;">
              <NTag v-if="item.status === 1" type="success"> 显示 </NTag>
              <NTag v-else type="info">隐藏</NTag>
            </td>
            <td style="text-align: center;">{{ item.createTime }}</td>
            <td style="text-align: center;">
              <NButton
                type="primary"
                size="small"
                quaternary
                v-access:code="['sys:dept:edit']"
                @click="openDialog(item.id, item.parentId)"
              >
                编辑
              </NButton>

              <NButton
                type="primary"
                size="small"
                quaternary
                v-access:code="['sys:dept:delete']"
                @click="handleDelete(item.id)"
              >
                删除
              </NButton>
            </td>
          </tr>
        </tbody>
      </NTable>

    <DeptFormDialog ref="deptFormDialogRef" @success="handleQuery" />
  </div>
</template>
