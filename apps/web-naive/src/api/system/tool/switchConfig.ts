import { requestClient } from '#/api/request';

export interface SwitchConfigQuery extends PageQuery {
  configName?: string;
}

export interface SwitchConfigPage {
  id: string;
  configName: string;
  configKey: string;
  configValue: boolean;
  remark: string;
}

export type SwitchConfigPageResult = PageResult<SwitchConfigPage[]>;

export interface SwitchConfigForm {
  id?: string;
  configName: string;
  remark: string;
}

/**
 * 业务配置分页列表
 * @returns
 * @param switchConfigQuery
 */
export async function selectSwitchConfigPageApi(
  switchConfigQuery: SwitchConfigQuery,
) {
  return requestClient.get<SwitchConfigPageResult>('/sysSwitchConfig/page', {
    params: switchConfigQuery,
  });
}

/**
 * 获取业务配置信息
 * @param id
 * @returns
 */
export async function getSwitchConfigApi(id: string) {
  return requestClient.get<SwitchConfigForm>(`/sysSwitchConfig/${id}`);
}

/**
 * 更新业务配置信息
 * @returns
 * @param switchConfigForm
 */
export async function updateSwitchConfigApi(
  switchConfigForm: SwitchConfigForm,
) {
  return requestClient.put('/sysSwitchConfig/update', switchConfigForm);
}

/**
 * 启动或关闭业务配置开关
 * @param id
 * @param configKey
 * @param configValue
 * @returns
 */
export async function updateStatusApi(
  id: string,
  configKey: string,
  configValue: boolean,
) {
  return requestClient.put(
    `/sysSwitchConfig/update/${id}`,
    {},
    {
      params: {
        configKey,
        configValue,
      },
    },
  );
}
