<script setup lang="ts">
import type { MenuForm } from '#/api/system/sys/menu';

import { onMounted, reactive, ref } from 'vue';

import { IconPicker } from '@vben/common-ui';

import { ElForm, ElMessage } from 'element-plus';

import {
  addMenuApi,
  editMenuApi,
  getMenuDetailApi,
  menuOptionApi,
} from '#/api/system/sys/menu';
import { MenuTypeEnum } from '#/enums/MenuTypesEnum';

const emit = defineEmits<{ (e: 'success'): void }>();

const menuFormRef = ref(ElForm);

// 顶级菜单下拉选项
const menuOptionData = ref<OptionType[]>([]);

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
  ElMessage.success(menuId ? '修改菜单成功' : '新增菜单成功');
  emit('success');
  closeDialog();
};

defineExpose({ openDialog });

onMounted(() => {
  menuOptionTree();
});
</script>
<template>
  <el-drawer
    v-model="dialog.visible"
    :title="dialog.title"
    direction="rtl"
    size="40%"
    destroy-on-close
    @close="closeDialog"
    resizable
  >
    <div class="">
      <ElForm
        ref="menuFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="pr-4"
      >
      <el-form-item label="父级菜单" prop="parentId">
        <el-tree-select
          placeholder="选择上级菜单"
          v-model="formData.parentId"
          :data="menuOptionData"
          filterable
          check-strictly
          :render-after-expand="false"
        />
      </el-form-item>

      <el-form-item label="菜单名称" prop="menuName">
        <el-input v-model="formData.menuName" placeholder="请输入菜单名称" />
      </el-form-item>

      <el-form-item>
        <el-radio-group v-model="formData.menuType" @change="onMenuTypeChange">
          <el-radio value="CATALOG">目录</el-radio>
          <el-radio value="MENU">菜单</el-radio>
          <el-radio value="BUTTON">按钮</el-radio>
          <el-radio value="EXTLINK">外链</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="formData.menuType === MenuTypeEnum.EXTLINK"
        label="外链"
        prop="routePath"
      >
        <el-input
          v-model="formData.routePath"
          placeholder="请输入外链完整路径"
        />
      </el-form-item>

      <el-form-item
        v-if="formData.menuType === MenuTypeEnum.MENU"
        prop="routeName"
      >
        <template #label>
          <div>
            路由名称
            <el-tooltip placement="bottom" effect="light">
              <template #content>
                如果需要开启缓存，需保证页面 defineOptions 中的 name
                与此处一致，建议使用驼峰。
              </template>
              <i-ep-QuestionFilled class="inline-block" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.routeName" placeholder="User" />
      </el-form-item>

      <el-form-item
        v-if="
          formData.menuType === MenuTypeEnum.CATALOG ||
          formData.menuType === MenuTypeEnum.MENU
        "
        label=""
        prop="routePath"
      >
        <template #label>
          <div>
            路由路径
            <el-tooltip placement="bottom" effect="light">
              <template>
                定义应用中不同页面对应的 url 路径, 目录需要以 / 开头，
                菜单项不可用。例如：系统管理目录 /system,
                系统管理下的用户管理菜单 user。
              </template>
              <i-ep-QuestionFilled class="inline-block" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-if="formData.menuType === MenuTypeEnum.CATALOG"
          v-model="formData.routePath"
          placeholder="system"
        />
        <el-input v-else v-model="formData.routePath" placeholder="user" />
      </el-form-item>

      <!-- 组件页面完整路径 -->
      <el-form-item
        v-if="formData.menuType === MenuTypeEnum.MENU"
        prop="component"
      >
        <template #label>
          <div>
            组件路径
            <el-tooltip placement="bottom" effect="light">
              <template>
                组件页面完整路径，相对于 src/views/, 如
                system/user/index,缺省后缀 .vue
                <i-ep-QuestionFilled class="inline-block" />
              </template>
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.component"
          placeholder="system/user/index"
          style="width: 95%"
        >
          <template v-if="formData.menuType === MenuTypeEnum.MENU" #prepend>
            src/views/
          </template>
          <template v-if="formData.menuType === MenuTypeEnum.MENU" #append>
            .vue
          </template>
        </el-input>
      </el-form-item>

      <el-form-item v-if="formData.menuType === MenuTypeEnum.MENU">
        <template #label>
          <div>
            路由参数
            <el-tooltip placement="bottom" effect="light">
              <template #content>
                组件页面使用 `useRoute().query.参数名` 获取路由参数值。
              </template>
              <i-ep-QuestionFilled class="inline-block" />
            </el-tooltip>
          </div>
        </template>

        <div v-if="!formData.params || formData.params.length === 0">
          <el-button
            type="success"
            plain
            @click="formData.params = [{ key: '', value: '' }]"
          >
            添加路由参数
          </el-button>
        </div>

        <div v-else>
          <div v-for="(item, index) in formData.params" :key="index">
            <el-input
              v-model="item.key"
              placeholder="参数名"
              class="w-[100px]"
            />

            <span class="mx-1">=</span>

            <el-input
              v-model="item.value"
              placeholder="参数值"
              class="w-[100px]"
            />

            <el-icon
              class="color-[var(--el-color-success)] ml-2 cursor-pointer"
              style="vertical-align: -0.15em"
              v-if="
                formData.params.indexOf(item) === formData.params.length - 1
              "
              @click="formData.params.push({ key: '', value: '' })"
            >
              <CirclePlusFilled />
            </el-icon>
            <el-icon
              class="color-[var(--el-color-danger)] ml-2 cursor-pointer"
              style="vertical-align: -0.15em"
              @click="formData.params.splice(formData.params.indexOf(item), 1)"
            >
              <DeleteFilled />
            </el-icon>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="菜单状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">显示</el-radio>
          <el-radio :value="-1">隐藏</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="
          formData.menuType === MenuTypeEnum.CATALOG ||
          formData.menuType === MenuTypeEnum.MENU
        "
        label="根目录始终显示"
      >
        <template #label>
          <div>
            是否始终显示
            <el-tooltip placement="bottom" effect="light">
              <template #content>
                当设置为始终显示时，即使只有一个子菜单也会显示
              </template>
              <i-ep-QuestionFilled class="inline-block" />
            </el-tooltip>
          </div>
        </template>

        <el-radio-group v-model="formData.alwaysShow">
          <el-radio :value="1">是</el-radio>
          <el-radio :value="-1">否</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="formData.menuType === MenuTypeEnum.MENU"
        label="是否缓存"
      >
        <el-radio-group v-model="formData.keepAlive">
          <el-radio :value="1">是</el-radio>
          <el-radio :value="-1">否</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" />
      </el-form-item>

      <!--  v-if="formData.menuType == MenuTypeEnum.BUTTON
        || formData.menuType == MenuTypeEnum.MENU" -->
      <el-form-item
        label="权限标识"
        prop="perm"
        v-if="formData.menuType === MenuTypeEnum.BUTTON"
      >
        <el-input v-model="formData.perm" placeholder="sys:user:add" />
      </el-form-item>

      <el-form-item
        v-if="formData.menuType !== MenuTypeEnum.BUTTON"
        label="图标"
        prop="icon"
      >
        <IconPicker v-model="formData.icon" />
      </el-form-item>

      <el-form-item
        v-if="formData.menuType === MenuTypeEnum.CATALOG"
        label="跳转路由"
      >
        <el-input v-model="formData.redirect" placeholder="跳转路由" />
      </el-form-item>
    </ElForm>
    </div>
    <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">

</style>
