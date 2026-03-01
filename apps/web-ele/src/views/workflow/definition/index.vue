<template>
  <div class="workflow-definition">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">流程定义管理</h1>
      <div class="flex space-x-2">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增流程
        </el-button>
        <el-button @click="handleImport">
          <el-icon><Download /></el-icon>
          导入流程
        </el-button>
      </div>
    </div>

    <el-form :inline="true" :model="queryParams" class="mb-4">
      <el-form-item label="流程名称">
        <el-input v-model="queryParams.processName" placeholder="请输入流程名称" clearable />
      </el-form-item>
      <el-form-item label="流程分类">
        <el-select v-model="queryParams.category" placeholder="请选择流程分类" clearable>
          <el-option
            v-for="category in categories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="草稿" value="0" />
          <el-option label="已发布" value="1" />
          <el-option label="已停用" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="definitionList"
      style="width: 100%"
      border
    >
      <el-table-column prop="processName" label="流程名称" width="180" />
      <el-table-column prop="processKey" label="流程Key" width="150" />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column prop="version" label="版本" width="80" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag
            :type="scope.row.status === 1 ? 'success' : scope.row.status === 2 ? 'warning' : 'info'"
          >
            {{ scope.row.statusName }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="formType" label="表单类型" width="120">
        <template #default="scope">
          {{ scope.row.formType === 1 ? '在线表单' : '自定义表单' }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleView(scope.row)">
            查看
          </el-button>
          <el-button size="small" @click="handleEdit(scope.row)">
            编辑
          </el-button>
          <el-button size="small" @click="handleCopy(scope.row)">
            复制
          </el-button>
          <el-button
            size="small"
            type="primary"
            v-if="scope.row.status === 0"
            @click="handlePublish(scope.row)"
          >
            发布
          </el-button>
          <el-button
            size="small"
            type="warning"
            v-if="scope.row.status === 1"
            @click="handleDisable(scope.row)"
          >
            停用
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
          <el-button size="small" @click="handleExport(scope.row)">
            导出
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-between items-center mt-4">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { workflowApi } from '@/api/workflow';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Refresh, Download } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const loading = ref(false);
const definitionList = ref([]);
const total = ref(0);
const router = useRouter();
const categories = ref([]);

const queryParams = reactive({
  page: 1,
  limit: 10,
  processName: '',
  category: '',
  status: undefined
});

// 加载流程分类
const loadCategories = async () => {
  try {
    const res = await workflowApi.definition.getCategoryList();
    categories.value = res.data;
  } catch (error) {
    console.error('加载分类失败', error);
  }
};

// 加载流程定义列表
const loadDefinitions = async () => {
  loading.value = true;
  try {
    const res = await workflowApi.definition.getDefinitionPage(queryParams);
    definitionList.value = res.data.list;
    total.value = res.data.total;
  } catch (error) {
    console.error('加载流程定义失败', error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleQuery = () => {
  queryParams.page = 1;
  loadDefinitions();
};

// 重置
const resetQuery = () => {
  Object.assign(queryParams, {
    processName: '',
    category: '',
    status: undefined
  });
  handleQuery();
};

// 分页
const handleSizeChange = (size) => {
  queryParams.limit = size;
  loadDefinitions();
};

const handleCurrentChange = (current) => {
  queryParams.page = current;
  loadDefinitions();
};

// 新增
const handleAdd = () => {
  router.push('/workflow/definition/add');
};

// 编辑
const handleEdit = (row) => {
  router.push(`/workflow/definition/edit/${row.id}`);
};

// 查看
const handleView = (row) => {
  router.push(`/workflow/definition/view/${row.id}`);
};

// 复制
const handleCopy = async (row) => {
  try {
    await workflowApi.definition.copyDefinition(row.id);
    ElMessage.success('复制成功');
    loadDefinitions();
  } catch (error) {
    console.error('复制失败', error);
  }
};

// 发布
const handlePublish = async (row) => {
  try {
    await workflowApi.definition.publishDefinition(row.id);
    ElMessage.success('发布成功');
    loadDefinitions();
  } catch (error) {
    console.error('发布失败', error);
  }
};

// 停用
const handleDisable = async (row) => {
  try {
    await workflowApi.definition.disableDefinition(row.id);
    ElMessage.success('停用成功');
    loadDefinitions();
  } catch (error) {
    console.error('停用失败', error);
  }
};

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该流程定义吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await workflowApi.definition.deleteDefinition(row.id);
    ElMessage.success('删除成功');
    loadDefinitions();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error);
      ElMessage.error('删除失败');
    }
  }
};

// 导入
const handleImport = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.bpmn,.bpmn20.xml';
  input.onchange = async (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await workflowApi.definition.importDefinition(formData);
      ElMessage.success('导入成功');
      loadDefinitions();
    } catch (error) {
      console.error('导入失败', error);
      ElMessage.error('导入失败');
    }
  };
  input.click();
};

// 导出
const handleExport = async (row) => {
  try {
    const res = await workflowApi.definition.exportDefinition(row.id);
    const blob = new Blob([res.data], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${row.processName}.bpmn20.xml`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('导出失败', error);
    ElMessage.error('导出失败');
  }
};

onMounted(() => {
  loadCategories();
  loadDefinitions();
});
</script>

<style scoped>
.workflow-definition {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
