<script setup lang="ts">
import { ref, watch } from 'vue';

import { QuestionFilled, Switch } from '@element-plus/icons-vue';
import { ElMessage, ElTree } from 'element-plus';

import { menuOptionApi, updateRoleMenusApi } from '#/api/system/sys/menu';
import { getRoleMenuIdsApi } from '#/api/system/sys/role';
import { useAuthStore } from '#/store';
import { useAccessStore } from '@vben/stores';
import { generateAccess } from '#/router/access';
import { router } from '#/router';
import { accessRoutes } from '#/router/routes';

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void;
}>();

const loading = ref(false);

const visible = ref(false);

// 获取store实例
const authStore = useAuthStore();
const accessStore = useAccessStore();

const roleName = ref('');

const roleId = ref('');

const menuTreeRef = ref(ElTree);

// 树展开默认选中的值
const checkedMenuIds = ref<string[]>([]);

const permMenuName = ref('');

const isExpanded = ref(true);

const parentChildrenLink = ref(true);

const menuOptionData = ref<OptionType[]>([]);

async function menuOption() {
  const data = await menuOptionApi();
  menuOptionData.value = data;
}

// 展开和收缩菜单权限
function toggleMenuTree() {
  isExpanded.value = !isExpanded.value;
  if (menuTreeRef.value) {
    Object.values(menuTreeRef.value.store.nodesMap).forEach((node: any) => {
      if (isExpanded.value) {
        node.expand();
      } else {
        node.collapse();
      }
    });
  }
}

watch(permMenuName, (val) => {
  menuTreeRef.value!.filter(val);
});

function handlePermFilter(
  value: string,
  data: {
    [key: string]: any;
  },
) {
  if (!value) return true;
  return data.label.includes(value);
}

// 父子节点是否自动关联
function handleParentChildrenChange(val: any) {
  parentChildrenLink.value = val;
}

/**
 * 打开角色分配菜单弹窗
 * @param id
 * @param name
 */
async function openMenuDialog(id: string, name: string) {
  visible.value = true;
  roleId.value = id;
  roleName.value = name;
  // 获取菜单下拉树选项
  await menuOption();

  getRoleMenuIdsApi(id).then((data) => {
    checkedMenuIds.value = data;
    checkedMenuIds.value.forEach((menuId) =>
      menuTreeRef.value.setChecked(menuId, true, false),
    );
  });
}

function closeMenuDialog() {
  roleId.value = '';
  roleName.value = '';
  visible.value = false;
}

/**
 * 角色分配菜单保存提交
 */
function handleRoleMenuSubmit() {
  const id = roleId.value;
  if (id) {
    const checkedMenuIds: string[] = menuTreeRef.value
      .getCheckedNodes(false, true)
      .map((node: any) => node.value);

    loading.value = true;
    updateRoleMenusApi(id, checkedMenuIds)
      .then(async () => {
        ElMessage.success('分配权限成功');
        
        // 菜单授权变更时，重新获取用户信息并更新菜单路由
        try {
          // 重新获取用户信息
          await authStore.fetchUserInfo();
          
          // 重新生成菜单和路由
          const { accessibleMenus, accessibleRoutes } = await generateAccess({
            router,
            roles: [],
            routes: accessRoutes
          });
          
          // 更新accessStore中的菜单和路由
          accessStore.setAccessMenus(accessibleMenus);
          accessStore.setAccessRoutes(accessibleRoutes);
          accessStore.setIsAccessChecked(true);
        } catch (error) {
          console.error('更新菜单路由失败:', error);
        }
        
        visible.value = false;
        emit('success');
      })
      .finally(() => {
        roleId.value = '';
        roleName.value = '';
        loading.value = false;
      });
  }
}

defineExpose({ openMenuDialog });
</script>

<template>
  <el-drawer
    destroy-on-close
    v-model="visible"
    :title="roleName"
  >
    <div>
      <el-input
        v-model="permMenuName"
        clearable
        class="w-[150px]"
        placeholder="菜单名称"
      >
        <template #prefix>
          <Search />
        </template>
      </el-input>
      <div class="flex-center ml-5 mt-5">
        <el-button type="primary" size="small" plain @click="toggleMenuTree">
          <template #icon><Switch /></template>
          {{ isExpanded ? '收缩' : '展开' }}
        </el-button>

        <el-checkbox
          v-model="parentChildrenLink"
          class="ml-5"
          @change="handleParentChildrenChange"
        >
          父子联动
        </el-checkbox>
        <el-tooltip placement="bottom">
          <template #content>
            如果只需勾选菜单权限，不需要勾选子菜单或者按钮权限，请关闭父子联动
          </template>
          <el-icon
            class="color-[--el-color-primary] ml-1 inline-block cursor-pointer"
          >
            <QuestionFilled />
          </el-icon>
        </el-tooltip>
      </div>
    </div>
    <ElTree
      ref="menuTreeRef"
      node-key="value"
      show-checkbox
      default-expand-all
      :data="menuOptionData"
      :filter-node-method="handlePermFilter"
      :check-strictly="!parentChildrenLink"
      class="mt-5"
    >
      <template #default="{ data }">{{ data.label }}</template>
    </ElTree>

    <template #footer>
      <div class="flex-center">
        <el-button @click="closeMenuDialog">取消</el-button>
        <el-button type="primary" @click="handleRoleMenuSubmit">
          确定
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>