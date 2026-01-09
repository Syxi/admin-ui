<script setup lang="ts">
import type { UserForm } from '#/api/system/sys/user';

import { reactive, ref } from 'vue';

import { NForm, NFormItem, NInput, NRadioGroup, NRadio, NTreeSelect } from 'naive-ui';
import { message } from '#/adapter/naive';

import {
  addUserApi,
  editUserApi,
  getUserDetailApi,
} from '#/api/system/sys/user';
import { Dictionary } from '#/components/dictionary';
import { ImageUpload } from '#/components/image-upload';

const emit = defineEmits<{ (e: 'success'): void }>();

// 用户表单
const userFormRef = ref(NForm);

// 加载状态
const loading = ref(false);

// 用户表单数据
const formData = reactive<UserForm>({
  status: 1,
  avatar: '',
});

// 弹窗对象
const dialog = reactive({
  visible: false,
  width: 800,
  title: '',
});

// 校验规则
const rules = {
  username: {
    required: true,
    message: '登录账号不能为空',
    trigger: ['input', 'blur']
  },
  realName: {
    required: true,
    message: '用户名不能为空',
    trigger: ['input', 'blur']
  },
  deptId: {
    required: true,
    message: '所属部门不能为空',
    trigger: ['input', 'blur']
  },
  // password: { required: true, message: "密码不能为空", trigger: 'blur'},
  // roleIds: { required: true, message: "用户角色不能为空", trigger: "blur" },
  email: {
    pattern: /\w[-\w.+]*@([A-Z0-9][-A-Z0-9]+\.)+[A-Z]{2,14}/i,
    message: '请输入正确的邮箱地址',
    trigger: ['input', 'blur'],
  },
  mobile: {
    pattern: /^1[3-9|]\d{9}$/, 
    message: '请输入正确的手机号码',
    trigger: ['input', 'blur'],
  },
};

function resetForm() {
  userFormRef.value.resetFields();
  userFormRef.value.clearValidate();
  formData.userId = undefined;
  formData.status = 1;
  formData.avatar = '';
}

// 组织下拉选项树数据
const deptTreeOptionData = ref<any[]>([]);

// 新增或编辑用户弹出窗口事件
async function openDialog(userId?: string, treeData?: any[]) {
  deptTreeOptionData.value = treeData || [];
  dialog.visible = true;
  if (userId) {
    dialog.title = '修改用户';
    const data = await getUserDetailApi(userId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增用户';
  }
}

// 关闭弹窗
function closeDialog() {
  dialog.visible = false;
  resetForm();
  deptTreeOptionData.value = [];
}

// 提交表单
const handleSubmit = async () => {
  try {
    await userFormRef.value.validate();
  } catch (error) {
    console.error('表单验证失败:', error);
    return;
  }

  loading.value = true;

  try {
    const userId = formData.userId;
    await (userId ? editUserApi(formData) : addUserApi(formData));
    message.success(userId ? '修改用户成功!' : '新增用户成功！');
    emit('success');
    closeDialog();
  } finally {
    loading.value = false;
  }
};

defineExpose({ openDialog });
</script>
<template>
  <n-modal
    v-model:show="dialog.visible"
    :title="dialog.title"
    :bordered="false"
    size="huge"
    @close="closeDialog()"
  >
    <n-form
      ref="userFormRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      :label-width="100"
      size="small"
    >
      <n-grid :x-gap="24" :y-gap="0" :cols="2">
        <n-grid-item :span="1">
          <div class="flex justify-center">
            <ImageUpload v-model:model-value="formData.avatar" />
          </div>
        </n-grid-item>

        <n-grid-item :span="1">
          <n-form-item label="登录账号：" path="username">
            <n-input
              v-model:value="formData.username"
              placeholder="请输入登录账号"
            />
          </n-form-item>

          <n-form-item label="真实姓名：" path="realName">
            <n-input
              v-model:value="formData.realName"
              placeholder="请输入用户姓名"
            />
          </n-form-item>

          <n-form-item label="性别：" path="gender">
            <Dictionary v-model="formData.gender" type-code="gender" />
          </n-form-item>

          <n-form-item label="机构：" path="deptId">
            <n-tree-select
              v-model:value="formData.deptId"
              :options="deptTreeOptionData"
              :default-expand-all="true"
              filterable
            />
          </n-form-item>

          <n-form-item label="手机号码：" path="mobile">
            <n-input
              v-model:value="formData.mobile"
              placeholder="请输入手机号码"
              :maxlength="11"
            />
          </n-form-item>

          <n-form-item label="邮箱：" path="email">
            <n-input
              v-model:value="formData.email"
              placeholder="请输入邮箱"
              :maxlength="50"
            />
          </n-form-item>

          <n-form-item label="状态：" path="status">
            <n-radio-group v-model:value="formData.status">
              <n-radio :value="1">启用</n-radio>
              <n-radio :value="-1">禁用</n-radio>
            </n-radio-group>
          </n-form-item>
        </n-grid-item>
      </n-grid>
    </n-form>

    <template #footer>
      <div class="dialog-footer">
        <n-space>
          <n-button @click="closeDialog()">取消</n-button>
          <n-button type="primary" @click="handleSubmit()">确定</n-button>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>
