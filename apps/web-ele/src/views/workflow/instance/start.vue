<template>
  <div class="workflow-instance-start">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">启动流程</h1>
      <el-button @click="handleCancel">取消</el-button>
    </div>

    <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px" class="mb-4">
      <el-form-item label="流程定义" prop="definitionId">
        <el-select v-model="formData.definitionId" placeholder="请选择流程定义">
          <el-option
            v-for="definition in definitions"
            :key="definition.id"
            :label="`${definition.processName} (v${definition.version})`"
            :value="definition.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="业务标题" prop="businessTitle">
        <el-input v-model="formData.businessTitle" placeholder="请输入业务标题" />
      </el-form-item>
      <el-form-item label="业务类型" prop="businessType">
        <el-input v-model="formData.businessType" placeholder="请输入业务类型" />
      </el-form-item>
      <el-form-item label="业务Key" prop="businessKey">
        <el-input v-model="formData.businessKey" placeholder="请输入业务Key" />
      </el-form-item>
      <el-form-item label="流程变量">
        <el-button type="primary" size="small" @click="addVariable">
          添加变量
        </el-button>
        <div v-for="(variable, index) in formData.variables" :key="index" class="flex items-center mt-2">
          <el-input v-model="variable.name" placeholder="变量名" class="w-1/4 mr-2" />
          <el-input v-model="variable.value" placeholder="变量值" class="w-1/4 mr-2" />
          <el-select v-model="variable.type" placeholder="变量类型" class="w-1/4 mr-2">
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="布尔值" value="boolean" />
            <el-option label="对象" value="object" />
          </el-select>
          <el-button type="danger" size="small" @click="removeVariable(index)">
            删除
          </el-button>
        </div>
      </el-form-item>
    </el-form>

    <div class="flex justify-center space-x-4">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit">启动流程</el-button>
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
const definitions = ref([]);

const formData = reactive({
  definitionId: undefined,
  businessTitle: '',
  businessType: '',
  businessKey: '',
  variables: []
});

const rules = {
  definitionId: [{ required: true, message: '请选择流程定义', trigger: 'change' }],
  businessTitle: [{ required: true, message: '请输入业务标题', trigger: 'blur' }],
  businessType: [{ required: true, message: '请输入业务类型', trigger: 'blur' }],
  businessKey: [{ required: true, message: '请输入业务Key', trigger: 'blur' }]
};

// 加载流程定义列表
const loadDefinitions = async () => {
  try {
    const res = await workflowApi.definition.getDefinitionPage({ status: 1 });
    definitions.value = res.data.list;
  } catch (error) {
    console.error('加载流程定义失败', error);
  }
};

// 添加变量
const addVariable = () => {
  formData.variables.push({ name: '', value: '', type: 'string' });
};

// 删除变量
const removeVariable = (index: number) => {
  formData.variables.splice(index, 1);
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 转换变量格式
        const variablesObj = {};
        formData.variables.forEach(variable => {
          if (variable.name) {
            let value = variable.value;
            switch (variable.type) {
              case 'number':
                value = Number(value);
                break;
              case 'boolean':
                value = value === 'true' || value === true;
                break;
              case 'object':
                try {
                  value = JSON.parse(value);
                } catch (e) {
                  value = variable.value;
                }
                break;
            }
            variablesObj[variable.name] = value;
          }
        });

        const startData = {
          definitionId: formData.definitionId,
          businessTitle: formData.businessTitle,
          businessType: formData.businessType,
          businessKey: formData.businessKey,
          variables: variablesObj
        };

        await workflowApi.instance.startProcess(startData);
        ElMessage.success('流程启动成功');
        router.push('/workflow/instance');
      } catch (error) {
        console.error('启动流程失败', error);
        ElMessage.error('启动流程失败');
      }
    }
  });
};

// 取消
const handleCancel = () => {
  router.push('/workflow/instance');
};

onMounted(() => {
  loadDefinitions();
});
</script>

<style scoped>
.workflow-instance-start {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>