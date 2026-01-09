<template>
  <n-modal v-model:show="visible" :title="title" preset="card" style="width: 600px; max-width: 90vw;">
    <n-form
      ref="assignFormRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="120px"
    >
      <n-form-item label="租户名称" path="tenantName">
        <n-input v-model:value="formData.tenantName" :disabled="true" />
      </n-form-item>

      <n-form-item label="选择套餐" path="packageId">
        <n-select
          v-model:value="formData.packageId"
          placeholder="请选择套餐"
          :options="packageList.map(item => ({
            label: item.name,
            value: item.id,
            render: () => h('div', { style: { display: 'flex', justifyContent: 'space-between' }}, [
              h('span', item.name),
              h('span', { style: { float: 'right', color: '#8492a6', fontSize: '13px' }}, 
                `最大用户数: ${item.maxUsers || '-'}, 最大存储: ${item.maxStorage || '-'}MB`
              )
            ])
          }))"
        />
      </n-form-item>
      </n-form>
    <template #footer>
      <div class="dialog-footer">
        <n-space justify="end">
          <n-button @click="close">取消</n-button>
          <n-button type="primary" @click="handleSubmit(assignFormRef)">确定</n-button>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, h } from 'vue';
import { 
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NOption,
  NButton,
  useMessage
} from 'naive-ui';
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

const message = useMessage();

// 表单验证规则
const rules = {
  packageId: {
    required: true,
    message: '请选择套餐',
    trigger: ['change', 'blur']
  },
};

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

  try {
    await formEl.validate();
    try {
      await assignTenantPackageApi(formData.tenantId, formData.packageId);
      message.success('套餐授权成功');
      close();
      emit('success');
    } catch (error) {
      console.error('套餐授权失败:', error);
      message.error('套餐授权失败');
    }
  } catch (error) {
    console.error('表单验证失败:', error);
  }
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
    message.error('加载套餐列表失败');
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
