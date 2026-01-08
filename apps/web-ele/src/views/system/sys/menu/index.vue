<script setup lang="ts">
import type { MenuQuery, MenuVO } from '#/api/system/sys/menu';

import { onMounted, reactive, ref } from 'vue';

import { Refresh } from '@element-plus/icons-vue';
import { Icon } from '@iconify/vue';
import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import { deleteMenuApi, selectMenuTreeApi } from '#/api/system/sys/menu';
import { MenuTypeEnum } from '#/enums/MenuTypesEnum';
import { useCardHeight } from '#/hooks/useCardHeight';
import MenuFormDrawer from '#/views/system/sys/menu/MenuFormDrawer.vue';
import {useTableHeight} from "#/hooks/useTableHeight";

defineOptions({
  name: 'Menu',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const loading = ref(false);

// 查询参数
const queryParams = reactive<MenuQuery>({});

// 表格数据
const menuTableData = ref<MenuVO[]>([]);

const tableRef = ref();

// 选择表格的行菜单id
const selectedRowMenuId = ref<string | undefined>();

const buttonIcon = 'mdi:text-box-outline';

const allExpanded = ref(false);

const menuFormDrawer = ref(MenuFormDrawer);

function openDialog(parentId?: string, menuId?: string) {
  menuFormDrawer.value.openDialog(parentId, menuId);
}

// 展开或收缩表格树
const toggleAllRows = () => {
  const data = menuTableData.value;
  if (!data || data.length === 0) return;

  allExpanded.value = !allExpanded.value;

  const traverse = (nodes) => {
    nodes.forEach((node) => {
      tableRef.value.toggleRowExpansion(node, allExpanded.value);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(data);
};

/**
 * 查询
 */
function handleQuery() {
  // 重置组件
  loading.value = true;
  selectMenuTreeApi(queryParams)
    .then((data) => {
      menuTableData.value = data;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 重置查询
function handleResetQuery() {
  queryFormRef.value.resetFields();
  handleQuery();
}

// 行点击事件
function onRowClick(row: MenuVO) {
  selectedRowMenuId.value = row.menuId;
}

/**
 * 删除菜单
 */
function handleDelete(menuId: string) {
  if (!menuId) {
    ElMessage.warning('请勾选删除项');
    return false;
  }

  ElMessageBox.confirm('确定删除已选中的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      deleteMenuApi(menuId).then(() => {
        ElMessage.success('删除成功');
        handleQuery();
      });
    })
    .catch(() => ElMessage.info('已取消删除'));
}

const { tableHeight } = useTableHeight(queryFormRef, { tableOffset: -30 });

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div  class="app-container">
      <ElForm
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        @submit.prevent
      >
        <el-form-item prop="menuName">
          <el-input
            v-model="queryParams.menuName"
            placeholder="菜单名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery()"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <template #icon>
              <el-icon><Search /></el-icon>
            </template>
            搜索
          </el-button>

          <el-button type="primary" @click="handleResetQuery">
            <template #icon>
              <el-icon><Refresh /></el-icon>
            </template>
            重置
          </el-button>

          <el-button
            v-access:code="['sys:menu:add']"
            type="primary"
            @click="openDialog('0', undefined)"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增菜单
          </el-button>

          <!-- 新增：展开/折叠按钮 -->
          <el-button type="primary" @click="toggleAllRows">
            <template #icon>
              <el-icon>
                <ArrowDown v-if="!allExpanded" /><ArrowUp v-else />
              </el-icon>
            </template>
            {{ allExpanded ? '收起全部' : '展开全部' }}
          </el-button>
        </el-form-item>
      </ElForm>
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="menuTableData"
        highlight-current-row
        row-key="menuId"
        @row-click="onRowClick"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :height="tableHeight"
        stripe
      >
        <el-table-column label="菜单名称" min-width="100">
          <template #default="scope">
            <span class="icon-container">
              <Icon
                :icon="scope.row.icon ? scope.row.icon : buttonIcon"
                class="menu-icon"
              />
              <span class="menu-name">{{ scope.row.menuName }}</span>
            </span>
          </template>
        </el-table-column>

        <el-table-column label="类型" align="center" width="120">
          <template #default="scope">
            <el-tag
              v-if="scope.row.menuType === MenuTypeEnum.CATALOG"
              type="primary"
            >
              目录
            </el-tag>
            <el-tag
              v-if="scope.row.menuType === MenuTypeEnum.MENU"
              type="success"
            >
              菜单
            </el-tag>
            <el-tag
              v-if="scope.row.menuType === MenuTypeEnum.BUTTON"
              type="danger"
            >
              按钮
            </el-tag>
            <el-tag
              v-if="scope.row.menuType === MenuTypeEnum.EXTLINK"
              type="info"
            >
              外链
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="路由名称"
          align="left"
          width="150"
          prop="routeName"
        />

        <el-table-column
          label="路由路径"
          align="left"
          width="150"
          prop="routePath"
        />

        <el-table-column
          label="组件路径"
          align="left"
          width="300"
          prop="component"
        />

        <el-table-column
          label="权限标识"
          align="center"
          width="200"
          prop="perm"
        />

        <el-table-column label="状态" align="center" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">显示</el-tag>
            <el-tag v-else type="info">隐藏</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序" align="center" width="80" prop="sort" />

        <el-table-column label="操作" align="center" width="200">
          <template #default="scope">
            <el-button
              v-if="
                scope.row.menuType === 'CATALOG' ||
                scope.row.menuType === 'MENU'
              "
              v-access:code="['sys:menu:add']"
              type="primary"
              link
              size="small"
              @click.stop="openDialog(scope.row.menuId, undefined)"
            >
              <el-icon><Plus /></el-icon>
              新增
            </el-button>

            <el-button
              v-access:code="['sys:menu:edit']"
              type="primary"
              link
              size="small"
              @click.stop="openDialog(undefined, scope.row.menuId)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              v-access:code="['sys:menu:delete']"
              type="primary"
              link
              size="small"
              @click.stop="handleDelete(scope.row.menuId)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

    <MenuFormDrawer ref="menuFormDrawer" @success="handleQuery" />
  </div>
</template>

<style scoped lang="scss">
.icon-container {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.menu-icon {
  display: inline-flex;
  align-items: center;
  margin-right: 4px; // 可以根据需要调整间距
}

.menu-name {
  display: inline-flex;
  align-items: center;
}
</style>
