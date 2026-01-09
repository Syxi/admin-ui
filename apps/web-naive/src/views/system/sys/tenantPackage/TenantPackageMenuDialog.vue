<template>
  <n-modal v-model:show="visible" :title="title" preset="card" style="width: 800px; max-width: 90vw;">
    <n-form
      ref="menuFormRef"
      :model="formData"
      label-placement="left"
      label-width="120px"
    >

      <n-form-item label="套餐名称" path="packageName">
        <n-input v-model:value="formData.packageName" :disabled="true" />
      </n-form-item>

      <n-form-item label="菜单权限">
        <n-tree
          ref="menuTreeRef"
          :data="menuTreeData"
          checkable
          :key-field="'id'"
          :label-field="'label'"
          :children-field="'children'"
          :default-checked-keys="checkedMenuIds"
          :expand-on-click="false"
          :cascade="true"
          :block-line="true"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <div class="dialog-footer">
        <n-space justify="end">
          <n-button @click="close">取消</n-button>
          <n-button type="primary" @click="handleSubmit">确定</n-button>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { 
  NModal,
  NForm,
  NFormItem,
  NInput,
  NTree,
  NButton,
  NSpace
} from 'naive-ui';
import { useMessage } from 'naive-ui';
import { 
  getAssignedMenusApi,
  assignMenusToPackageApi
} from '#/api/system/sys/tenantPackageMenu';
import { selectMenuTreeApi, type MenuVO } from '#/api/system/sys/menu';

interface FormData {
  packageId: string;
  packageName: string;
}

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}



const emit = defineEmits(['success']);

const menuFormRef = ref();
const menuTreeRef = ref();
const visible = ref(false);
const title = ref('');
const menuTreeData = ref<TreeNode[]>([]);
const checkedMenuIds = ref<string[]>([]);
const message = useMessage();
const formData = reactive<FormData>({
  packageId: '',
  packageName: '',
});

const treeProps = {
  children: 'children',
  label: 'label',
};

/**
 * 将菜单数据转换为树形结构
 */
function convertMenuTreeToTreeNode(menuList: MenuVO[]): TreeNode[] {
  if (!menuList || !Array.isArray(menuList)) {
    return [];
  }
  
  const result: TreeNode[] = [];
  
  menuList.forEach(menu => {
    const node: TreeNode = {
      id: menu.menuId,
      label: menu.menuName,
    };
    
    // 如果有子菜单，递归转换
    if (menu.children && Array.isArray(menu.children) && menu.children.length > 0) {
      node.children = convertMenuTreeToTreeNode(menu.children);
    }
    
    result.push(node);
  });
  
  return result;
}

/**
 * 打开菜单授权对话框
 */
function open(packageId: string, packageName: string) {
  visible.value = true;
  title.value = '套餐菜单授权';
  formData.packageId = packageId;
  formData.packageName = packageName || `套餐${packageId}`;
  
  loadMenuTree();
  loadAssignedMenus(packageId);
}

/**
 * 关闭对话框
 */
function close() {
  visible.value = false;
}

/**
 * 加载菜单树
 */
const loadMenuTree = async () => {
  try {
    const response = await selectMenuTreeApi({});
    // 将菜单数据转换为树形结构
    menuTreeData.value = convertMenuTreeToTreeNode(response.data);
  } catch (error) {
    console.error('加载菜单树失败:', error);
    message.error('加载菜单树失败');
  }
};

/**
 * 加载已分配的菜单
 */
const loadAssignedMenus = async (packageId: string) => {
  try {
    const response = await getAssignedMenusApi(packageId);
    checkedMenuIds.value = response.data || [];
  } catch (error) {
    console.error('加载已分配菜单失败:', error);
    message.error('加载已分配菜单失败');
  }
};

/**
 * 提交菜单授权
 */
const handleSubmit = async () => {
  try {
    const checkedKeys = menuTreeRef.value.getCheckedKeys();
    await assignMenusToPackageApi(formData.packageId, checkedKeys);
    message.success('菜单授权成功');
    close();
    emit('success');
  } catch (error) {
    console.error('菜单授权失败:', error);
    message.error('菜单授权失败');
  }
};

// 暴露方法给 ref
defineExpose({ open, close });
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style>