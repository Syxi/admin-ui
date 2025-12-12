<script setup lang="ts">
import type { DeptForm } from '#/api/system/sys/dept';

import { reactive, ref } from 'vue';

import { ElForm, ElMessage } from 'element-plus';

import {
  addDeptApi,
  editDeptApi,
  getDeptDetailApi,
} from '#/api/system/sys/dept';

const emit = defineEmits<{ (e: 'success'): void }>();
// 加载状态
const loading = ref(false);

// 弹出窗组织表单
const orgFormRef = ref(ElForm);

// 组织表单数据
const formData = reactive<DeptForm>({
  status: 1,
});

const rules = reactive({
  deptName: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  deptCode: [{ required: true, message: '编码不能为空', trigger: 'blur' }],
  deptType: [{ required: true, message: '类型不能为空', trigger: 'blur' }],
  // parentId 验证规则根据实际情况调整
  parentId: [
    {
      validator: (rule: any, value: string, callback: any) => {
        // 如果是编辑状态或者是顶级机构（parentId为'0'），则不需要验证
        if (formData.id || value === '0') {
          callback();
        } else if (!value) {
          callback(new Error('上级机构不能为空'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
});

// 新增或编辑机构，弹出窗
const dialog = reactive({
  visible: false,
  title: '',
  type: '',
  width: 600,
});

// 组织下拉选项树数据
const deptTreeOptionData = ref<OptionType[]>([]);

/**
 * 新增或编辑机构，打开弹出窗
 */
async function openDialog(
  id?: string,
  parentId?: string,
  deptTreeData?: OptionType[],
) {
  deptTreeOptionData.value = deptTreeData || [];

  dialog.visible = true;
  if (id) {
    dialog.title = '修改';
    const data = await getDeptDetailApi(id);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增';
    // 确保 parentId 正确设置，如果是顶级机构则设置为 '0'
    formData.parentId = parentId !== undefined ? parentId : '0';
  }
}

/**
 * 新增或编辑机构，关闭弹出窗
 */
function handleCloseDialog() {
  orgFormRef.value.resetFields();
  orgFormRef.value.clearValidate();
  formData.id = undefined;
  deptTreeOptionData.value = [];
  dialog.visible = false;
}

/**
 * 提交表单
 * @param deptId
 */
async function handleSubmit() {
  const valid = orgFormRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    const id = formData.id;
    await (id ? editDeptApi(formData) : addDeptApi(formData));
    ElMessage.success(id ? '修改成功！' : '新增成功');
    handleCloseDialog();
    emit('success');
  } finally {
    loading.value = false;
  }
}

defineExpose({ openDialog });
</script>
<template>
  <el-dialog
    v-model="dialog.visible"
    :title="dialog.title"
    :width="dialog.width"
    append-to-body
    draggable
    center
    @close="handleCloseDialog()"
  >
    <ElForm
      ref="orgFormRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item
        label="上级机构"
        prop="parentId"
      >
        <el-tree-select
          v-model="formData.parentId"
          :data="deptTreeOptionData"
          filterable
          check-strictly
          :default-expand-all="true"
        />
      </el-form-item>

      <el-form-item prop="deptName" label="名称">
        <el-input v-model="formData.deptName" placeholder="名称" />
      </el-form-item>

      <el-form-item prop="deptCode" label="编码">
        <el-input v-model="formData.deptCode" placeholder="编码" />
      </el-form-item>

      <el-form-item label="类型" prop="deptType">
        <el-radio-group v-model="formData.deptType">
          <el-radio :value="1">机构</el-radio>
          <el-radio :value="2">部门</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="-1">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleCloseDialog()">
          取消
        </el-button>
        <el-button type="primary" @click="handleSubmit()">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>
