<script setup lang="ts">
import type { MenuForm } from '#/api/system/sys/menu';

import { onMounted, reactive, ref } from 'vue';

import { IconPicker } from '@vben/common-ui';

import { NForm, NFormItem, NInput, NInputNumber, NRadioGroup, NRadio, NTreeSelect, NButton, useMessage, NModal, NTooltip } from 'naive-ui';

import { h } from 'vue';

const message = useMessage();

import {
  addMenuApi,
  editMenuApi,
  getMenuDetailApi,
  menuOptionApi,
} from '#/api/system/sys/menu';
import { MenuTypeEnum } from '#/enums/MenuTypesEnum';

const emit = defineEmits<{ (e: 'success'): void }>();

const menuFormRef = ref();

// 顶级菜单下拉选项
const menuOptionData = ref<any[]>([]);

// 初始化菜单表单数据
const initialMenuFormData = ref<MenuForm>({
  menuId: undefined,
  parentId: '0',
  status: 1,
  menuType: MenuTypeEnum.MENU,
});

// 菜单表单数据
const formData = ref({ ...initialMenuFormData.value });

// 表单验证规则
const rules = reactive({
  parentId: [{ required: true, message: '请选择顶级菜单', trigger: 'blur' }],
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请输入菜单类型', trigger: 'blur' }],
  routePath: [{ required: true, message: '请输入路由路径', trigger: 'blue' }],
  component: [{ required: true, message: '请输入组件路径', trigger: 'blur' }],
});

const dialog = reactive({
  title: '',
  visible: false,
});

/**
 * 菜单下拉选项树
 */
async function menuOptionTree() {
  const data = await menuOptionApi();
  menuOptionData.value = data;
  menuOptionData.value = [{ value: '0', label: '顶级菜单', children: data }];
}

/**
 * 打开表单窗口
 * @param parentId 父菜单id
 * @param menuId 菜单id
 */
async function openDialog(parentId?: string, menuId?: string) {
  dialog.visible = true;
  // 菜单下拉选项树
  await menuOptionTree();
  if (menuId) {
    dialog.title = '编辑菜单';
    const data = await getMenuDetailApi(menuId);
    initialMenuFormData.value = { ...data };
    formData.value = data;
  } else {
    dialog.title = '新增菜单';
    formData.value.parentId = parentId;
  }
}

/**
 * 重置表单
 */
function resetForm() {
  menuFormRef.value.resetFields();
  menuFormRef.value.clearValidate();
  formData.value.menuId = undefined;
}

/**
 * 关闭弹窗
 */
function closeDialog() {
  dialog.visible = false;
  resetForm();
}

/**
 * 菜单类型切换事件处理
 */
function onMenuTypeChange() {
  // 如果菜单类型改变，清空路由路径，未改变在切换后还原路由路径
  if (
    formData.value.menuType !== initialMenuFormData.value.menuType &&
    formData.value.menuType === MenuTypeEnum.MENU
  ) {
    // 目录切换到菜单时，清空组件
    if (initialMenuFormData.value.menuType === MenuTypeEnum.CATALOG) {
      formData.value.routePath = '';
    } else {
      // 其他情况，保留原有的组件路径
      formData.value.routePath = initialMenuFormData.value.routePath;
      formData.value.component = initialMenuFormData.value.component;
    }
  }
}

/**
 * 提交表单
 */
const submitForm = async () => {
  const valid = menuFormRef.value.validate();
  if (!valid) return;

  const menuId = formData.value.menuId;
  await (menuId ? editMenuApi(formData.value) : addMenuApi(formData.value));
  message.success(menuId ? '修改菜单成功' : '新增菜单成功');
  emit('success');
  closeDialog();
};

defineExpose({ openDialog });

onMounted(() => {
  menuOptionTree();
});
</script>
<template>
  <NModal
    v-model:show="dialog.visible"
    :title="dialog.title"
    :show-icon="false"
    preset="dialog"
    style="width: 800px;"
    @close="closeDialog"
  >
    <NForm
      ref="menuFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      style="max-width: 700px"
    >
      <NFormItem label="父级菜单" path="parentId">
        <NTreeSelect
          placeholder="选择上级菜单"
          v-model:value="formData.parentId"
          :options="menuOptionData"
          filterable
          :check-strategy="'child'"
        />
      </NFormItem>

      <NFormItem label="菜单名称" path="menuName">
        <NInput v-model:value="formData.menuName" placeholder="请输入菜单名称" />
      </NFormItem>

      <NFormItem>
        <NRadioGroup v-model:value="formData.menuType" @update:value="onMenuTypeChange">
          <NRadio :value="'CATALOG'">目录</NRadio>
          <NRadio :value="'MENU'">菜单</NRadio>
          <NRadio :value="'BUTTON'">按钮</NRadio>
          <NRadio :value="'EXTLINK'">外链</NRadio>
        </NRadioGroup>
      </NFormItem>

      <NFormItem
        v-if="formData.menuType === MenuTypeEnum.EXTLINK"
        label="外链"
        path="routePath"
      >
        <NInput
          v-model:value="formData.routePath"
          placeholder="请输入外链完整路径"
        />
      </NFormItem>

      <NFormItem
        v-if="formData.menuType === MenuTypeEnum.MENU"
        path="routeName"
      >
        <template #label>
          <div>
            路由名称
            <NTooltip placement="bottom">
              <template #trigger>
                <i-ep-QuestionFilled class="inline-block" />
              </template>
              如果需要开启缓存，需保证页面 defineOptions 中的 name
              与此处一致，建议使用驼峰。
            </NTooltip>
          </div>
        </template>
        <NInput v-model:value="formData.routeName" placeholder="User" />
      </NFormItem>

      <NFormItem
        v-if="
          formData.menuType === MenuTypeEnum.CATALOG ||
          formData.menuType === MenuTypeEnum.MENU
        "
        label=""
        path="routePath"
      >
        <template #label>
          <div>
            路由路径
            <NTooltip placement="bottom">
              <template #trigger>
                <i-ep-QuestionFilled class="inline-block" />
              </template>
              定义应用中不同页面对应的 url 路径, 目录需要以 / 开头，
              菜单项不可用。例如：系统管理目录 /system,
              系统管理下的用户管理菜单 user。
            </NTooltip>
          </div>
        </template>
        <NInput
          v-if="formData.menuType === MenuTypeEnum.CATALOG"
          v-model:value="formData.routePath"
          placeholder="system"
        />
        <NInput v-else v-model:value="formData.routePath" placeholder="user" />
      </NFormItem>

      <!-- 组件页面完整路径 -->
      <NFormItem
        v-if="formData.menuType === MenuTypeEnum.MENU"
        path="component"
      >
        <template #label>
          <div>
            组件路径
            <NTooltip placement="bottom">
              <template #trigger>
                <i-ep-QuestionFilled class="inline-block" />
              </template>
              组件页面完整路径，相对于 src/views/, 如
              system/user/index,缺省后缀 .vue
            </NTooltip>
          </div>
        </template>
        <NInput
          v-model:value="formData.component"
          placeholder="system/user/index"
          style="width: 95%"
        />
      </NFormItem>

      <NFormItem v-if="formData.menuType === MenuTypeEnum.MENU">
        <template #label>
          <div>
            路由参数
            <NTooltip placement="bottom">
              <template #trigger>
                <i-ep-QuestionFilled class="inline-block" />
              </template>
              组件页面使用 `useRoute().query.参数名` 获取路由参数值。
            </NTooltip>
          </div>
        </template>

        <div v-if="!formData.params || formData.params.length === 0">
          <NButton
            type="success"
            @click="formData.params = [{ key: '', value: '' }]"
          >
            添加路由参数
          </NButton>
        </div>

        <div v-else>
          <div v-for="(item, index) in formData.params" :key="index">
            <NInput
              v-model:value="item.key"
              placeholder="参数名"
              style="width: 100px; margin-right: 4px;"
            />

            <span class="mx-1">=</span>

            <NInput
              v-model:value="item.value"
              placeholder="参数值"
              style="width: 100px; margin-right: 4px;"
            />

            <NIcon
              class="text-green-500 ml-2 cursor-pointer"
              style="vertical-align: -0.15em"
              v-if="
                formData.params.indexOf(item) === formData.params.length - 1
              "
              @click="formData.params.push({ key: '', value: '' })"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/>
              </svg>
            </NIcon>
            <NIcon
              class="text-red-500 ml-2 cursor-pointer"
              style="vertical-align: -0.15em"
              @click="formData.params.splice(formData.params.indexOf(item), 1)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10s10-4.47 10-10S17.53 2 12 2m5 13.59L15.59 17L12 13.41L8.41 17L7 15.59L10.59 12L7 8.41L8.41 7L12 10.59L15.59 7L17 8.41L13.41 12L17 15.59Z"/>
              </svg>
            </NIcon>
          </div>
        </div>
      </NFormItem>

      <NFormItem label="菜单状态" path="status">
        <NRadioGroup v-model:value="formData.status">
          <NRadio :value="1">显示</NRadio>
          <NRadio :value="-1">隐藏</NRadio>
        </NRadioGroup>
      </NFormItem>

      <NFormItem
        v-if="
          formData.menuType === MenuTypeEnum.CATALOG ||
          formData.menuType === MenuTypeEnum.MENU
        "
        label="根目录始终显示"
      >
        <template #label>
          <div>
            是否始终显示
            <NTooltip placement="bottom">
              <template #trigger>
                <i-ep-QuestionFilled class="inline-block" />
              </template>
              当设置为始终显示时，即使只有一个子菜单也会显示
            </NTooltip>
          </div>
        </template>

        <NRadioGroup v-model:value="formData.alwaysShow">
          <NRadio :value="1">是</NRadio>
          <NRadio :value="-1">否</NRadio>
        </NRadioGroup>
      </NFormItem>

      <NFormItem
        v-if="formData.menuType === MenuTypeEnum.MENU"
        label="是否缓存"
      >
        <NRadioGroup v-model:value="formData.keepAlive">
          <NRadio :value="1">是</NRadio>
          <NRadio :value="-1">否</NRadio>
        </NRadioGroup>
      </NFormItem>

      <NFormItem label="排序" path="sort">
        <NInputNumber v-model:value="formData.sort" :min="0" />
      </NFormItem>

      <!--  v-if="formData.menuType == MenuTypeEnum.BUTTON
        || formData.menuType == MenuTypeEnum.MENU" -->
      <NFormItem
        label="权限标识"
        path="perm"
        v-if="formData.menuType === MenuTypeEnum.BUTTON"
      >
        <NInput v-model:value="formData.perm" placeholder="sys:user:add" />
      </NFormItem>

      <NFormItem
        v-if="formData.menuType !== MenuTypeEnum.BUTTON"
        label="图标"
        path="icon"
      >
        <IconPicker v-model="formData.icon" />
      </NFormItem>

      <NFormItem
        v-if="formData.menuType === MenuTypeEnum.CATALOG"
        label="跳转路由"
      >
        <NInput v-model:value="formData.redirect" placeholder="跳转路由" />
      </NFormItem>
    </NForm>

    <template #action>
      <div class="dialog-footer">
        <NButton @click="closeDialog">取消</NButton>
        <NButton type="primary" @click="submitForm">确定</NButton>
      </div>
    </template>
  </NModal>
</template>
