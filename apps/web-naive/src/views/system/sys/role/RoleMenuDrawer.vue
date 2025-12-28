<script setup lang="ts">
import { ref, watch } from 'vue';

import { useMessage, NTree, NDrawer, NInput, NButton, NCheckbox, NTooltip } from 'naive-ui';

import { h } from 'vue';

const message = useMessage();

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

const roleName = ref('');

const roleId = ref('');

const menuTreeRef = ref();

// 树展开默认选中的值
const checkedMenuIds = ref<string[]>([]);

const permMenuName = ref('');

const isExpanded = ref(true);

const parentChildrenLink = ref(true);

const menuOptionData = ref<any[]>([]);

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
      .then(() => {
        message.success('分配权限成功');
        visible.value = false;
        emit('success');
      })
    closeMenuDialog();
  }
}

defineExpose({ openMenuDialog });
</script>

<template>
  <NDrawer
    v-model:show="visible"
    :title="roleName"
    :auto-focus="false"
    :trap-focus="false"
    @after-leave="closeMenuDialog"
  >
    <NDrawerContent title="角色菜单权限" closable>
      <div>
        <NInput
          v-model:value="permMenuName"
          clearable
          style="width: 150px"
          placeholder="菜单名称"
        >
        </NInput>
        <div class="flex items-center ml-5 mt-5">
          <NButton type="primary" size="small" @click="toggleMenuTree">
            {{ isExpanded ? '收缩' : '展开' }}
          </NButton>

          <NCheckbox
            v-model:checked="parentChildrenLink"
            class="ml-5"
            @update:checked="handleParentChildrenChange"
          >
            父子联动
          </NCheckbox>
          <NTooltip placement="bottom">
            <template #trigger>
              <NIcon class="text-blue-500 ml-1 inline-block cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8z"/>
                  <path fill="currentColor" d="M12 17a1 1 0 0 1-1-1v-4a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1z"/>
                  <circle cx="12" cy="8" r="1" fill="currentColor"/>
                </svg>
              </NIcon>
            </template>
            如果只需勾选菜单权限，不需要勾选子菜单或者按钮权限，请关闭父子联动
          </NTooltip>
        </div>
      </div>
      <NTree
        ref="menuTreeRef"
        key-field="value"
        :data="menuOptionData"
        :default-expanded-keys="[]"
        :checkable="true"
        :checked-keys="checkedMenuIds"
        :on-update:checked-keys="(keys: string[]) => checkedMenuIds = keys"
        class="mt-5"
      >
      </NTree>

      <template #footer>
        <div class="flex items-center justify-center">
          <NButton @click="closeMenuDialog">取消</NButton>
          <NButton type="primary" @click="handleRoleMenuSubmit">
            确定
          </NButton>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
