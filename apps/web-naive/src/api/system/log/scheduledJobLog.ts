import { requestClient } from '#/api/request';

export interface ScheduledJobLogPage {
  id?: string;

  jobId?: string;

  jobName?: string;

  beanName?: string;

  methodName?: string;

  errorInfo?: string;

  status?: number;

  executeTime?: number;

  startTime?: Date;

  endTime?: Date;

  createUser?: string;

  updateUser?: string;
}

export type ScheduledJobLogPageResult = PageResult<ScheduledJobLogPage[]>;

export interface ScheduledJobLogQuery extends PageQuery {
  jobName?: string;

  beanName?: string;

  status?: number;
}

/**
 * 定时任务日志分页列表
 * @returns
 * @param scheduledJobLogQuery
 */
export async function selectScheduledJobLogPageApi(
  scheduledJobLogQuery: ScheduledJobLogQuery,
) {
  return requestClient.get<ScheduledJobLogPageResult>('/scheduledJobLog/page', {
    params: scheduledJobLogQuery,
  });
}
