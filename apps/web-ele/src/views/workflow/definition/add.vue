<template>
  <div class="workflow-definition-add">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">新增流程定义</h1>
      <el-button @click="handleCancel">取消</el-button>
    </div>

    <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px" class="mb-4">
      <el-form-item label="流程名称" prop="processName">
        <el-input v-model="formData.processName" placeholder="请输入流程名称" />
      </el-form-item>
      <el-form-item label="流程Key" prop="processKey">
        <el-input v-model="formData.processKey" placeholder="请输入流程Key" />
      </el-form-item>
      <el-form-item label="流程分类" prop="category">
        <el-select v-model="formData.category" placeholder="请选择流程分类">
          <el-option
            v-for="category in categories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="表单类型" prop="formType">
        <el-radio-group v-model="formData.formType">
          <el-radio label="1">在线表单</el-radio>
          <el-radio label="2">自定义表单</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="表单ID" prop="formId" v-if="formData.formType === '1'">
        <el-select v-model="formData.formId" placeholder="请选择表单">
          <el-option
            v-for="form in forms"
            :key="form.id"
            :label="form.formName"
            :value="form.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="自定义表单URL" prop="formUrl" v-if="formData.formType === '2'">
        <el-input v-model="formData.formUrl" placeholder="请输入自定义表单URL" />
      </el-form-item>
      <el-form-item label="流程描述">
        <el-input v-model="formData.description" type="textarea" placeholder="请输入流程描述" />
      </el-form-item>
      <el-form-item label="是否启用">
        <el-switch v-model="formData.isEnabled" />
      </el-form-item>
    </el-form>

    <div class="flex justify-center space-x-4">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { workflowApi } from '@/api/workflow';
import { ElMessage, ElForm } from 'element-plus';
import { useRouter } from 'vue-router';

const router = useRouter();
const formRef = ref<InstanceType<typeof ElForm>>();
const categories = ref([]);
const forms = ref([]);

const formData = reactive({
  processName: '',
  processKey: '',
  category: '',
  formType: '1',
  formId: undefined,
  formUrl: '',
  description: '',
  isEnabled: true
});

const rules = {
  processName: [{ required: true, message: '请输入流程名称', trigger: 'blur' }],
  processKey: [{ required: true, message: '请输入流程Key', trigger: 'blur' }],
  category: [{ required: true, message: '请选择流程分类', trigger: 'change' }],
  formId: [{ required: formData.formType === '1', message: '请选择表单', trigger: 'change' }],
  formUrl: [{ required: formData.formType === '2', message: '请输入自定义表单URL', trigger: 'blur' }]
};

// 加载流程分类
const loadCategories = async () => {
  try {
    const res = await workflowApi.definition.getCategoryList();
    categories.value = res.data;
  } catch (error) {
    console.error('加载分类失败', error);
  }
};

// 加载表单列表
const loadForms = async () => {
  try {
    const res = await workflowApi.form.getPublishedForms();
    forms.value = res.data;
  } catch (error) {
    console.error('加载表单失败', error);
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await workflowApi.definition.addDefinition(formData);
        ElMessage.success('创建成功');
        router.push('/workflow/definition');
      } catch (error) {
        console.error('创建失败', error);
        ElMessage.error('创建失败');
      }
    }
  });
};

// 取消
const handleCancel = () => {
  router.push('/workflow/definition');
};

onMounted(() => {
  loadCategories();
  loadForms();
});
</script>

<style scoped>
.workflow-definition-add {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>