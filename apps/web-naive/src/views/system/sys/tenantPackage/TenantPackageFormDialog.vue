<template>
  <!-- 弹窗主体 -->
  <n-modal v-model:show="visible" :title="title" preset="card" style="width: 600px; max-width: 90vw;">
    <n-form
      ref="tenantPackageFormRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="100px"
    >

      <n-form-item label="套餐名称" path="name">
        <n-input v-model:value="formData.name" placeholder="请输入套餐名称" />
      </n-form-item>

      <n-form-item label="套餐编码" path="code">
        <n-input v-model:value="formData.code" placeholder="请输入套餐编码" />
      </n-form-item>

      <n-form-item label="套餐描述" path="description">
        <n-input
          v-model:value="formData.description"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 5 }"
          placeholder="请输入套餐描述"
        />
      </n-form-item>

      <n-form-item label="最大用户数" path="maxUsers">
        <n-input-number
          v-model:value="formData.maxUsers"
          :min="1"
          placeholder="请输入最大用户数"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item label="最大存储空间(MB)" path="maxStorage">
        <n-input-number
          v-model:value="formData.maxStorage"
          :min="0"
          placeholder="请输入最大存储空间(MB)"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item label="有效期(天)" path="validityDays">
        <n-input-number
          v-model:value="formData.validityDays"
          :min="0"
          placeholder="请输入有效期(天)"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item label="状态" path="status">
        <n-radio-group v-model:value="formData.status">
          <n-radio :value="1" size="medium">启用</n-radio>
          <n-radio :value="-1" size="medium">禁用</n-radio>
        </n-radio-group>
      </n-form-item>

      <n-form-item label="排序" path="sort">
        <n-input-number v-model:value="formData.sort" :min="0" />
      </n-form-item>

      <n-form-item label="备注" path="remark">
        <n-input
          v-model:value="formData.remark"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 5 }"
          placeholder="请输入备注"
        />
      </n-form-item>
    </n-form>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <n-space justify="end">
          <n-button @click="close">取消</n-button>
          <n-button type="primary" @click="handleSubmit(tenantPackageFormRef)">
            确定
          </n-button>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { 
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadioGroup,
  NRadio,
  NButton,
  useMessage
} from 'naive-ui';
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
const message = useMessage();
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
  name: {
    required: true,
    validator: (rule: any, value: any) => {
      if (!value) {
        return new Error('请输入套餐名称');
      }
      if (value.length < 1 || value.length > 50) {
        return new Error('套餐名称长度在1-50个字符');
      }
      return true;
    },
    trigger: ['input', 'blur']
  },
  code: {
    required: true,
    validator: (rule: any, value: any) => {
      if (!value) {
        return new Error('请输入套餐编码');
      }
      if (value.length < 1 || value.length > 50) {
        return new Error('套餐编码长度在1-50个字符');
      }
      return true;
    },
    trigger: ['input', 'blur']
  },
  status: {
    required: true,
    message: '请选择状态',
    trigger: ['blur', 'change']
  },
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

  try {
    await formEl.validate();
    const id = formData.id;
    await (id ? editTenantPackageApi(formData) : addTenantPackageApi(formData));
    message.success(id ? '修改租户套餐成功' : '新增租户套餐成功');
    close();
    emit('success'); // 通知父组件刷新列表
  } catch (error) {
    console.error('表单验证失败:', error);
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