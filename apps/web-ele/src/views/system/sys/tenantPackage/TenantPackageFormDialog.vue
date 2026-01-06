<template>
  <!-- 弹窗主体 -->
  <el-dialog
    center
    draggable
    v-model="visible"
    :title="title"
    width="600px"
    @close="close"
  >
    <ElForm
      ref="tenantPackageFormRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="套餐名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入套餐名称" />
      </el-form-item>

      <el-form-item label="套餐编码" prop="code">
        <el-input v-model="formData.code" placeholder="请输入套餐编码" />
      </el-form-item>

      <el-form-item label="套餐描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入套餐描述"
        />
      </el-form-item>

      <el-form-item label="最大用户数" prop="maxUsers">
        <el-input-number
          v-model="formData.maxUsers"
          :min="1"
          placeholder="请输入最大用户数"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="最大存储空间(MB)" prop="maxStorage">
        <el-input-number
          v-model="formData.maxStorage"
          :min="0"
          placeholder="请输入最大存储空间(MB)"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="有效期(天)" prop="validityDays">
        <el-input-number
          v-model="formData.validityDays"
          :min="0"
          placeholder="请输入有效期(天)"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="-1">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注"
        />
      </el-form-item>
    </ElForm>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="handleSubmit(tenantPackageFormRef)">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElForm, ElMessage } from 'element-plus';
import { 
  addTenantPackageApi, 
  editTenantPackageApi, 
  tenantPackageDetailApi 
} from '#/api/system/sys/tenantPackage';

interface FormData {
  id?: string;
  name: string;
  code: string;
  description?: string;
  maxUsers?: number;
  maxStorage?: number;
  validityDays?: number;
  status: number;
  sort?: number;
  remark?: string;
}

const emit = defineEmits(['success']);

const tenantPackageFormRef = ref();
const visible = ref(false);
const title = ref('');
const formData = reactive<FormData>({
  name: '',
  code: '',
  description: '',
  maxUsers: 10,
  maxStorage: 1024,
  validityDays: 365,
  status: 1,
  sort: 0,
  remark: '',
});

// 表单验证规则
const rules = reactive({
  name: [
    { required: true, message: '请输入套餐名称', trigger: 'blur' },
    { min: 1, max: 50, message: '套餐名称长度在1-50个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入套餐编码', trigger: 'blur' },
    { min: 1, max: 50, message: '套餐编码长度在1-50个字符', trigger: 'blur' },
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' },
  ],
});

/**
 * 打开弹窗
 * @param id 租户套餐ID，为空则为新增
 */
function open(id?: string) {
  visible.value = true;
  if (id) {
    title.value = '编辑租户套餐';
    getTenantPackageFormData(id);
  } else {
    title.value = '新增租户套餐';
    // 重置表单
    Object.assign(formData, {
      name: '',
      code: '',
      description: '',
      maxUsers: 10,
      maxStorage: 1024,
      validityDays: 365,
      status: 1,
      sort: 0,
      remark: '',
    });
  }
}

/**
 * 关闭弹窗
 */
function close() {
  visible.value = false;
}

/**
 * 获取租户套餐数据
 * @param id 租户套餐ID
 */
async function getTenantPackageFormData(id: string) {
  const data = await tenantPackageDetailApi(id);
  Object.assign(formData, data);
}

/**
 * 租户套餐保存提交
 */
const handleSubmit = async (formEl: any | undefined) => {
  if (!formEl) return;

  await formEl.validate(async (valid: boolean) => {
    if (valid) {
      const id = formData.id;
      await (id ? editTenantPackageApi(formData) : addTenantPackageApi(formData));
      ElMessage.success(id ? '修改租户套餐成功' : '新增租户套餐成功');
      close();
      emit('success'); // 通知父组件刷新列表
    }
  });
};

// 暴露方法给 ref
defineExpose({ open, close });
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style>