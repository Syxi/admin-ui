<script setup lang="ts">
import type { MenuQuery, MenuVO } from '#/api/system/sys/menu';

import { onMounted, reactive, ref, h } from 'vue';

import { Icon } from '@iconify/vue';
import { NForm, NFormItem, NInput, NButton, NPopconfirm, useMessage, useDialog, NDataTable, NTag, DataTableInst } from 'naive-ui';
import { Search, Refresh, Plus, Edit, Delete, ArrowDown, ArrowUp } from '@vicons/ionicons5';
import type { FormInst } from 'naive-ui';

import { deleteMenuApi, selectMenuTreeApi } from '#/api/system/sys/menu';
import { MenuTypeEnum } from '#/enums/MenuTypesEnum';
import MenuFormDialog from '#/views/system/sys/menu/MenuFormDialog.vue';

defineOptions({
  name: 'Menu',
  inheritAttrs: false,
});

const queryFormRef = ref<FormInst>();

const message = useMessage();
const dialog = useDialog();

const loading = ref(false);

// 查询参数
const queryParams = reactive<MenuQuery>({});

// 表格数据
const menuTableData = ref<MenuVO[]>([]);

const tableRef = ref<DataTableInst | null>(null);

// 选择表格的行菜单id
const selectedRowMenuId = ref<string | undefined>();

const buttonIcon = 'mdi:text-box-outline';

const expandedKeys = ref([]);
const allExpanded = ref(false);

const menuFormDialog = ref();

function openDialog(parentId?: string, menuId?: string) {
  menuFormDialog.value.openDialog(parentId, menuId);
}

// 展开或收缩表格树
const toggleAllRows = () => {
  const data = menuTableData.value;
  if (!data || data.length === 0) return;

  allExpanded.value = !allExpanded.value;

  const collectKeys = (nodes: MenuVO[]) => {
    const keys: string[] = [];
    const traverse = (nodes: MenuVO[]) => {
      nodes.forEach((node) => {
        keys.push(node.menuId);
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return keys;
  };

  expandedKeys.value = allExpanded.value ? collectKeys(data) : [];
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
    message.warning('请勾选删除项');
    return false;
  }

  dialog.warning({
    title: '警告',
    content: '确定删除已选中的数据项?',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      deleteMenuApi(menuId).then(() => {
        message.success('删除成功');
        handleQuery();
      });
    },
    onNegativeClick: () => {
      message.info('已取消删除');
    }
  });
}

const tableHeight = ref(500); // 临时设置表格高度，待后续实现useTableHeight hook

// 定义表格列
const columns = [
  {
    title: '菜单名称',
    key: 'menuName',
    minWidth: 100,
    render: (row) => {
      return h('span', { class: 'icon-container' }, [
        h(Icon, { icon: row.icon ? row.icon : buttonIcon, class: 'menu-icon' }),
        h('span', { class: 'menu-name' }, row.menuName)
      ]);
    }
  },
  {
    title: '类型',
    key: 'menuType',
    width: 120,
    align: 'center',
    render: (row) => {
      if (row.menuType === MenuTypeEnum.CATALOG) {
        return h(NTag, { type: 'primary' }, { default: () => '目录' });
      } else if (row.menuType === MenuTypeEnum.MENU) {
        return h(NTag, { type: 'success' }, { default: () => '菜单' });
      } else if (row.menuType === MenuTypeEnum.BUTTON) {
        return h(NTag, { type: 'error' }, { default: () => '按钮' });
      } else if (row.menuType === MenuTypeEnum.EXTLINK) {
        return h(NTag, { type: 'info' }, { default: () => '外链' });
      }
      return null;
    }
  },
  {
    title: '路由名称',
    key: 'routeName',
    width: 150,
    align: 'left',
  },
  {
    title: '路由路径',
    key: 'routePath',
    width: 150,
    align: 'left',
  },
  {
    title: '组件路径',
    key: 'component',
    width: 300,
    align: 'left',
  },
  {
    title: '权限标识',
    key: 'perm',
    width: 200,
    align: 'center',
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    align: 'center',
    render: (row) => {
      return h(NTag, { type: row.status === 1 ? 'success' : 'info' }, { default: () => row.status === 1 ? '显示' : '隐藏' });
    }
  },
  {
    title: '排序',
    key: 'sort',
    width: 80,
    align: 'center',
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    align: 'center',
    render: (row) => {
      const buttons = [];
      
      if (row.menuType === 'CATALOG' || row.menuType === 'MENU') {
        buttons.push(
          h(NButton, {
            type: 'primary',
            size: 'small',
            quaternary: true,
            onClick: (e) => {
              e.stopPropagation();
              openDialog(row.menuId, undefined);
            }
          }, {
            default: () => '新增'
          })
        );
      }
      
      buttons.push(
        h(NButton, {
          type: 'primary',
          size: 'small',
          quaternary: true,
          onClick: (e) => {
            e.stopPropagation();
            openDialog(undefined, row.menuId);
          }
        }, {
          default: () => '编辑'
        })
      );
      
      buttons.push(
        h(NButton, {
          type: 'primary',
          size: 'small',
          quaternary: true,
          onClick: (e) => {
            e.stopPropagation();
            handleDelete(row.menuId);
          }
        }, {
          default: () => '删除'
        })
      );
      
      return buttons;
    }
  }
];

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div  class="app-container">
      <n-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        @submit.prevent="handleQuery"
      >
        <n-form-item prop="menuName">
          <n-input
            v-model:value="queryParams.menuName"
            placeholder="菜单名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery()"
          />
        </n-form-item>

        <n-form-item>
          <n-button attr-type="submit" type="primary" @click="handleQuery">
            <template #icon>
              <n-icon><Search /></n-icon>
            </template>
            搜索
          </n-button>

          <n-button type="primary" @click="handleResetQuery">
            <template #icon>
              <n-icon><Refresh /></n-icon>
            </template>
            重置
          </n-button>

          <n-button
            v-access:code="['sys:menu:add']"
            type="primary"
            @click="openDialog('0', undefined)"
          >
            <template #icon>
              <n-icon><Plus /></n-icon>
            </template>
            新增菜单
          </n-button>

          <!-- 新增：展开/折叠按钮 -->
          <n-button type="primary" @click="toggleAllRows">
            <template #icon>
              <n-icon>
                <ArrowDown v-if="!allExpanded" /><ArrowUp v-else />
              </n-icon>
            </template>
            {{ allExpanded ? '收起全部' : '展开全部' }}
          </n-button>
        </n-form-item>
      </n-form>
      <n-data-table
        ref="tableRef"
        :loading="loading"
        :data="menuTableData"
        :columns="columns"
        :row-key="row => row.menuId"
        :default-expand-all="allExpanded.value"
        :pagination="false"
        :scroll-x="1200"
        :height="tableHeight"
        :expanded-row-keys="expandedKeys"
        @update:expanded-row-keys="(keys) => expandedKeys = keys"
        @update:checked-row-keys="onRowClick"
      />

    <MenuFormDialog ref="menuFormDialog" @success="handleQuery" />
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
