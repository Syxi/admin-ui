import { requestClient } from '#/api/request';

export interface ScheduledJobPage {
  jobId?: string;

  jobName?: string;

  beanName?: string;

  methodName?: string;

  params?: string;

  cronExpression?: string;

  status?: number;

  lastExecutedTime?: Date;

  remark?: string;

  createUser?: string;

  updateUser?: string;

  createTime?: Date;

  updateTime?: Date;
}

export type ScheduledJobPageResult = PageResult<ScheduledJobPage[]>;

export interface ScheduledJobQuery extends PageQuery {
  jobName?: string;

  status?: number;
}

export interface ScheduledJobForm {
  jobId?: string;

  jobName?: string;

  jobClass?: string;

  methodName?: string;

  params?: string;

  cronExpression?: string;

  status?: number;

  remark?: string;

  cronPopover?: boolean;
}

/**
 * 定时任务分页列表
 * @returns
 * @param scheduledJobQuery
 */
export async function scheduledJobPageApi(
  scheduledJobQuery: ScheduledJobQuery,
) {
  return requestClient.get<ScheduledJobPageResult>('/scheduledJob/page', {
    params: scheduledJobQuery,
  });
}

/**
 * 新增定时任务
 * @returns
 * @param scheduledJobForm
 */
export async function addScheduledJobApi(scheduledJobForm: ScheduledJobForm) {
  return requestClient.post('/scheduledJob/add', scheduledJobForm);
}

/**
 * 更新定时任务
 * @returns
 * @param scheduledJobForm
 */
export async function updateScheduledJobApi(
  scheduledJobForm: ScheduledJobForm,
) {
  return requestClient.put('/scheduledJob/update', scheduledJobForm);
}

/**
 * 获取定时任务详情
 * @param id
 * @returns
 */
export async function getScheduledJobDetailApi(id: string) {
  return requestClient.get<ScheduledJobPage>(
    `/scheduledJob/scheduledJobDetail/${id}`,
  );
}

/**
 * 删除定时任务
 * @param ids
 * @returns
 */
export async function deleteScheduledJobApi(ids: string[]) {
  return requestClient.delete('/scheduledJob/delete', ids);
}

/**
 * 执行定时任务
 * @param ids
 * @returns
 */
export async function executeJobsApi(ids: string[]) {
  return requestClient.post('/scheduledJob/run', ids);
}

/**
 * 暂停定时任务
 * @param ids
 * @returns
 */
export async function pauseJobsApi(ids: string[]) {
  return requestClient.post('/scheduledJob/pause', ids);
}

/**
 * 获取所有定时任务的beanName
 * @returns
 */
export async function selectJobBeanNameListApi() {
  return requestClient.get<string[]>('/scheduledJob/jobBean');
}
