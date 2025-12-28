import { requestClient } from '#/api/request';

export interface FileRecordVO {
  id: string;

  fileName: string;

  fileMd5: string;

  fileSize: number;

  fileType: string;

  url: string;

  fileDescription: string;

  // 文件存储路径
  fileStoragePath: string;

  // pdf文件存储路径
  pdfStoragePath: string;

  /* */
  createTime: Date;

  /* */
  updateTime: Date;
}

export type FilePageResult = PageResult<FileRecordVO[]>;

export interface FileRecordQuery extends PageQuery {
  fileName?: string;
}

/**
 * 文件列表
 * queryParams
 * @returns
 */
export async function selectFilePageApi(fileRecordQuery: FileRecordQuery) {
  return requestClient.get<FilePageResult>('/file/page', {
    params: fileRecordQuery,
  });
}

/**
 * 上传文件
 * @param {string} file
 * @returns
 */
export async function fileUploadApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 下载文件
 * @returns
 * @param id
 */
export async function handleDownloadSourceFileApi(id: string) {
  return requestClient.get(`/file/downloadSourceFile/${id}`, {
    responseType: 'blob',
  });
}

/**
 * 下载pdf文件
 * @param id
 * @returns
 */
export async function handleDownloadPdfFileApi(id: string) {
  return requestClient.get(`/file/downloadPdfFile/${id}`, {
    responseType: 'blob',
  });
}

/**
 * 删除文件
 * @returns
 * @param ids
 */
export async function deleteFileApi(ids: string[]) {
  return requestClient.delete('/file/delete', ids);
}

/**
 * 预览文件
 * @param id
 * @returns
 */
export async function previewFileApi(id: string) {
  return requestClient.get(`/file/preview/${id}`, {
    responseType: 'arraybuffer',
  });
}
