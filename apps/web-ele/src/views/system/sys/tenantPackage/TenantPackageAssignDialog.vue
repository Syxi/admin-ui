<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="600px"
    center
    @close="close"
  >
    <el-form
      ref="assignFormRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="租户名称" prop="tenantName">
        <el-input v-model="formData.tenantName" disabled />
      </el-form-item>

      <el-form-item label="选择套餐" prop="packageId">
        <el-select
          v-model="formData.packageId"
          placeholder="请选择套餐"
          style="width: 100%"
        >
          <el-option
            v-for="item in packageList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
            <span>{{ item.name }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px">
              最大用户数: {{ item.maxUsers }}, 最大存储: {{ item.maxStorage }}MB
            </span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="handleSubmit(assignFormRef)">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElForm, ElMessage } from 'element-plus';
import { 
  selectTenantPackageListApi, 
  assignTenantPackageApi 
} from '#/api/system/sys/tenantPackage';

interface FormData {
  tenantId: string;
  tenantName: string;
  packageId: string;
}

interface PackageItem {
  id: string;
  name: string;
  maxUsers?: number;
  maxStorage?: number;
}

const emit = defineEmits(['success']);

const assignFormRef = ref();
const visible = ref(false);
const title = ref('');
const packageList = ref<PackageItem[]>([]);
const formData = reactive<FormData>({
  tenantId: '',
  tenantName: '',
  packageId: '',
});

// 表单验证规则
const rules = reactive({
  packageId: [
    { required: true, message: '请选择套餐', trigger: 'change' },
  ],
});

/**
 * 打开授权对话框
 */
function open(tenantId: string, tenantName: string) {
  visible.value = true;
  title.value = '租户套餐授权';
  formData.tenantId = tenantId;
  formData.tenantName = tenantName || `租户${tenantId}`;
  formData.packageId = '';
}

/**
 * 关闭对话框
 */
function close() {
  visible.value = false;
}

/**
 * 提交授权
 */
const handleSubmit = async (formEl: any | undefined) => {
  if (!formEl) return;

  await formEl.validate(async (valid: boolean) => {
    if (valid) {
      try {
        await assignTenantPackageApi(formData.tenantId, formData.packageId);
        ElMessage.success('套餐授权成功');
        close();
        emit('success');
      } catch (error) {
        console.error('套餐授权失败:', error);
        ElMessage.error('套餐授权失败');
      }
    }
  });
};

/**
 * 加载套餐列表
 */
const loadPackageList = async () => {
  try {
    const response = await selectTenantPackageListApi();
    packageList.value = response.map(item => ({
      id: item.id,
      name: item.name,
      maxUsers: item.maxUsers,
      maxStorage: item.maxStorage
    }));
  } catch (error) {
    console.error('加载套餐列表失败:', error);
    ElMessage.error('加载套餐列表失败');
  }
};

onMounted(() => {
  loadPackageList();
});

// 暴露方法给 ref
defineExpose({ open, close });
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style>
