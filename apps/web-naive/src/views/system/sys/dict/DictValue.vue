<script setup lang="ts">
import type {
  DictValueForm,
  DictValuePage,
  DictValueQuery,
} from '#/api/system/sys/dictValue';

import { onMounted, reactive, ref, watch } from 'vue';

import { NForm, NFormItem, NInput, NButton, NTable, NTag, NPagination, NCard, NDialog, useMessage } from 'naive-ui';

const message = useMessage();

import {
  addDictValueApi,
  deleteDictValuesApi,
  editDictValueApi,
  getDictValueDetailApi,
  selectDictValuePageApi,
} from '#/api/system/sys/dictValue';

defineOptions({
  name: 'DictValue',
  inheritAttrs: false,
});

const props = defineProps({
  typeCode: {
    type: String,
    default: () => {
      return '';
    },
  },
  typeName: {
    type: String,
    default: () => {
      return '';
    },
  },
});

watch(
  () => props.typeCode,
  (newVal: string) => {
    formData.typeCode = newVal;
    queryParams.typeCode = newVal;

    resetQuery();
  },
);

const queryFormRef = ref();

const dataFormRef = ref();

const loading = ref(false);

const ids = ref<string[]>([]);

const total = ref(0);

const queryParams = reactive<DictValueQuery>({
  page: 1,
  limit: 20,
  typeCode: props.typeCode,
});

const dictValueTableData = ref<DictValuePage[]>();
const currentRow = ref();

const formData = reactive<DictValueForm>({
  status: 1,
  typeCode: props.typeCode,
});

const dialog = reactive({
  title: '',
  visible: false,
});

const rules = reactive({
  name: [{ required: true, message: '请输入字典项名称', trigger: 'blur' }],
  value: [{ required: true, message: '请输入字典项值', trigger: 'blur' }],
});

// 查询
function handleQuery() {
  if (queryParams.typeCode) {
    loading.value = true;
    selectDictValuePageApi(queryParams)
      .then((data) => {
        dictValueTableData.value = data.list;
        total.value = data.total;
      })
      .finally(() => {
        loading.value = false;
      });
  }
}

/**
 * 重置查询
 */
function resetQuery() {
  queryFormRef.value.resetFields();
  queryParams.page = 1;

  handleQuery();
}

/**
 * 打开字典项表单弹窗
 * @param dictValueId
 */
async function openDialog(dictValueId?: string) {
  dialog.visible = true;
  if (dictValueId) {
    dialog.title = '修改字典项';
    const data = await getDictValueDetailApi(dictValueId);
    Object.assign(formData, data);
  } else {
    dialog.title = '新增字典项';
  }
}

/**
 * 关闭弹窗
 */
function closeDialog() {
  dialog.visible = false;
  resetForm();
}

/**
 * 重置表单
 */
function resetForm() {
  dataFormRef.value.resetFields();
  dataFormRef.value.clearValidate();

  formData.id = undefined;
  formData.status = 1;
  formData.typeCode = props.typeCode;
}

/**
 * 行复选框选中
 * @param selection
 */
function handleSelectionChange(selection: any) {
  ids.value = selection.map((item: any) => item.id);
}

/**
 * 提交表单
 */
async function handleSubmit() {
  const valid = dataFormRef.value.validate();
  if (!valid) return;
  loading.value = true;
  const dictValueId = formData.id;
  await (dictValueId ? editDictValueApi(formData) : addDictValueApi(formData));
  message.success(dictValueId ? '修改成功' : '新增成功');
  closeDialog();
  handleQuery();
  loading.value = false;
}

function handleDelete(dictValueId?: string) {
  let dictValueIds: string[];
  if (dictValueId) {
    dictValueIds = [String(dictValueId)]; // 删除单条记录
  } else if (ids.value.length > 0) {
    dictValueIds = ids.value; // 删除多条记录
  } else {
    message.warning('请勾选删除项'); // 没有选择任何选项
    return;
  }

  if (confirm('确定删除已选中的数据项?')) {
    deleteDictValuesApi(dictValueIds).then(() => {
      message.success('删除成功');
      resetQuery();
    });
  }
}

onMounted(() => {
  handleQuery();
});
</script>

<template>
  <div class="app-container">
      <NForm ref="queryFormRef" :model="queryParams" :inline="true" @submit.prevent>
        <NFormItem prop="name">
          <NInput
            v-model:value="queryParams.name"
            placeholder="字典项名称"
            clearable
            @keyup.enter="handleQuery()"
          />
        </NFormItem>

        <NFormItem>
          <NButton type="primary" @click="handleQuery()">
            搜索
          </NButton>

          <NButton type="primary" @click="resetQuery()">
            重置
          </NButton>

          <NButton type="primary" @click="openDialog()">
            新增
          </NButton>

          <NButton type="error" @click="handleDelete()">
            删除
          </NButton>
        </NFormItem>
      </NForm>

    <NCard shadow="never" class="table-container">
      <NTable
        :loading="loading"
        :data="dictValueTableData"
        :bordered="true"
        :single-line="false"
        @selection-change="handleSelectionChange"
      >
        <thead>
          <tr>
            <th style="width: 55px; text-align: center;">
              <input
                type="checkbox"
                @change="(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.checked) {
                    // 选中所有行
                    dictValueTableData?.forEach(row => {
                      if (!ids.includes(row.id)) {
                        ids.push(row.id);
                      }
                    });
                  } else {
                    // 取消选中所有行
                    ids.splice(0);
                  }
                }"
              />
            </th>
            <th style="width: 150px; text-align: center;">字典名称</th>
            <th style="width: 150px; text-align: center;">字典值</th>
            <th style="width: 100px; text-align: center;">状态</th>
            <th style="width: 100px; text-align: center;">排序</th>
            <th style="text-align: center;">备注</th>
            <th style="width: 200px; text-align: center;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in dictValueTableData"
            :key="row.id"
            @click="currentRow = row"
          >
            <td style="text-align: center;">
              <input
                type="checkbox"
                :checked="ids.includes(row.id)"
                @change="(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.checked) {
                    if (!ids.includes(row.id)) {
                      ids.push(row.id);
                    }
                  } else {
                    const index = ids.indexOf(row.id);
                    if (index > -1) {
                      ids.splice(index, 1);
                    }
                  }
                }"
              />
            </td>
            <td style="text-align: center;">{{ row.name }}</td>
            <td style="text-align: center;">{{ row.value }}</td>
            <td style="text-align: center;">
              <NTag v-if="row.status === 1" type="success">启用</NTag>
              <NTag v-else type="info">禁用</NTag>
            </td>
            <td style="text-align: center;">{{ row.sort }}</td>
            <td style="text-align: center;">{{ row.remark }}</td>
            <td style="text-align: center;">
              <NButton
                type="primary"
                size="small"
                quaternary
                @click.stop="openDialog(row.id)"
              >
                编辑
              </NButton>

              <NButton
                type="primary"
                size="small"
                quaternary
                @click.stop="handleDelete(row.id)"
              >
                删除
              </NButton>
            </td>
          </tr>
        </tbody>
      </NTable>

      <NPagination
        v-if="total > 0"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :item-count="total"
        :page-sizes="[10, 20, 30, 40, 50, 100]"
        @update:page="handleQuery"
        @update:page-size="handleQuery"
      />
    </NCard>

    <NDialog
      v-model:show="dialog.visible"
      :title="dialog.title"
      :style="{ width: '500px' }"
      @close="closeDialog()"
    >
      <NForm
        ref="dataFormRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <NFormItem label="字典名称">{{ typeName }}</NFormItem>
        <NFormItem path="name" label="字典项名称">
          <NInput v-model:value="formData.name" placeholder="请输入字典项名称" />
        </NFormItem>

        <NFormItem path="value" label="字典值">
          <NInput v-model:value="formData.value" placeholder="请输入字典值" />
        </NFormItem>

        <NFormItem path="status" label="状态">
          <NRadioGroup v-model:value="formData.status">
            <NRadio :value="1">正常</NRadio>
            <NRadio :value="-1">停用</NRadio>
          </NRadioGroup>
        </NFormItem>

        <NFormItem path="sort" label="排序">
          <NInputNumber v-model:value="formData.sort" :min="0" />
        </NFormItem>

        <NFormItem path="remark" label="备注">
          <NInput
            v-model:value="formData.remark"
            type="textarea"
            placeholder="字典项备注"
            :autosize="{ minRows: 2, maxRows: 6 }"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="dialog-footer">
          <NButton type="primary" @click="closeDialog()">取消</NButton>
          <NButton type="primary" @click="handleSubmit()">确定</NButton>
        </div>
      </template>
    </NDialog>
  </div>
</template>
