import { requestClient } from '#/api/request';

export interface VideoVO {
  id?: string;

  fileName?: string;

  // 文件存储路径
  filePath?: string;

  url: string;

  description?: string;

  remark?: string;

  createTime?: Date;

  updateTime?: Date;
}

export type VideoPageResult = PageResult<VideoVO[]>;

export interface VideoQuery extends PageQuery {
  fileName?: string;
}

/**
 * 多媒体文件分页列表
 * queryParams
 * @returns
 */
export async function selectVideosPageApi(videoQuery: VideoQuery) {
  return requestClient.get<VideoPageResult>('/video/page', {
    params: videoQuery,
  });
}

/**
 * 上传多媒体文件
 * @param {string} file
 * @returns
 */
export async function uploadVideoApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/video/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 下载多媒体文件
 * @param  fileName
 * @returns
 */
export async function downloadVideoApi(fileName: string) {
  return requestClient.get(`/video/download/${fileName}`, {
    responseType: 'blob',
  });
}

/**
 * 删除文件
 * @returns
 * @param ids
 */
export async function deleteVideoApi(ids: string[]) {
  return requestClient.delete('/video/delete', ids);
}

/**
 * 播放多媒体文件
 * @returns
 * @param fileName
 //  */
export async function playVideoApi(fileName: string) {
  return requestClient.get('/video/play', {
    params: {
      fileName,
    },
  });
}
