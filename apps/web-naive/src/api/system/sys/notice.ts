import { requestClient } from '#/api/request';

export interface NoticeVO {
  noticeId?: string;

  /* */
  noticeTitle?: string;

  /* */
  noticeType?: number;

  /* */
  noticeContext?: string;

  /* */
  isPublish?: number;

  /* */
  isTop?: number;

  /* */
  topTime?: Date;

  /* */
  remark?: string;

  /* */
  createTime?: Date;

  /* */
  updateTime?: Date;

  /* */
  createUser?: number;

  /* */
  updateUser?: number;
}

export type noticePageResult = PageResult<NoticeVO[]>;

export interface NoticeForm {
  noticeId?: string;

  /* */
  noticeTitle?: string;

  /* */
  noticeType?: number;

  /* */
  noticeContent?: string;

  /* */
  isPublish?: number;

  /* */
  isTop?: number;

  /* */
  topTime?: Date;

  /* */
  remark?: string;

  /* */
  createTime?: Date;

  /* */
  updateTime?: Date;

  /* */
  createUser?: number;

  /* */
  updateUser?: number;
}

export interface NoticeQuery extends PageQuery {
  noticeTitle?: string;
}

/**
 * 通知分页列表
 * @returns
 */
export async function selectNoticePageApi(noticeQuery: NoticeQuery) {
  return requestClient.get<noticePageResult>('/notice/page', {
    params: noticeQuery,
  });
}

/**
 * 新增通知
 * @returns
 * @param noticeForm
 */
export async function addNoticeApi(noticeForm: NoticeForm) {
  return requestClient.post('/notice/add', noticeForm);
}

/**
 * 获取通知信息
 * @param noticeId
 * @returns
 */
export async function getNoticeApi(noticeId: string) {
  return requestClient.get<NoticeVO>(`/notice/detail/${noticeId}`);
}

/**
 * 更新通知
 * @returns
 * @param noticeForm
 */
export async function updateNoticeApi(noticeForm: NoticeForm) {
  return requestClient.put('/notice/update', noticeForm);
}

/**
 * 删除通知
 * @param noticeIds
 * @returns
 */
export async function deleteNoticeApi(noticeIds: string[]) {
  return requestClient.delete('/notice/delete', noticeIds);
}

/**
 * 置顶通知
 * @param noticeId
 * @returns
 */
export async function topNoticeApi(noticeId: string) {
  return requestClient.put(`/notice/top/${noticeId}`);
}

/**
 * 取消置顶
 * @param noticeId
 * @returns
 */
export async function cancelTopNoticeApi(noticeId: string) {
  return requestClient.put(`/notice/cancelTop/${noticeId}`);
}

/**
 * 发布通知
 * @param noticeIds
 * @returns
 */
export async function publishNoticesApi(noticeIds: string[]) {
  return requestClient.post('/notice/publish', noticeIds);
}

/**
 * 取消发布通知
 * @param noticeIds
 * @returns
 */
export async function cancelPublishNoticesApi(noticeIds: string[]) {
  return requestClient.post('/notice/cancelPublish', noticeIds);
}

export async function getTopNoticeApi() {
  return requestClient.get<NoticeVO>('/notice/portal/top');
}
