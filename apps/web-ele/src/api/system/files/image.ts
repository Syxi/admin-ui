import { requestClient } from '#/api/request';

export interface ImagePage {
  id: string;
  imageName: string;
  imageMd5: string;
  imageSize: string;
  imageType: string;
  url: string;
  storagePath: string;
  description: string;
  createTime: Date;
  updateTime: Date;
}

export type ImagePageResult = PageResult<ImagePage[]>;

export interface ImageQuery extends PageQuery {
  imageName?: string;
}

export interface ImageForm {
  id?: string;
  imageName?: string;
}

/**
 * 上传单张图片
 * @param file
 * @returns
 */
export async function uploadImageApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post<string>(`/image/uploadImage`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 上传多张图片
 * @param files
 * @returns
 */
export async function uploadImagesApi(files: File[]) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('file', file);
  }
  return requestClient.post<string[]>('/image/uploadImages', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 图片分页列表
 * @returns
 * @param imageQuery
 */
export async function selectImagePageApi(imageQuery: ImageQuery) {
  return requestClient.get<ImagePageResult>('/image/page', {
    params: imageQuery,
  });
}

export async function getImageDetailsApi(id: string) {
  return requestClient.get<ImageForm>(`/image/${id}`);
}

/**
 * 更新图片信息
 * @returns
 * @param imageForm
 */
export async function updateImageApi(imageForm: ImageForm) {
  return requestClient.put('/image/edit', imageForm);
}

/**
 * 删除图片
 * @param ids
 * @returns
 */
export async function deleteImagesApi(ids: string[]) {
  return requestClient.delete('/image/delete', ids);
}

/**
 * 下载图片
 * @returns
 * @param id
 */
export async function handleDownloadImageApi(id: string) {
  return requestClient.get(`/image/downloadImage/${id}`, {
    responseType: 'blob',
  });
}

/**
 * 门户首页图片库
 * @returns
 */
export async function selectImageUrlsApi() {
  return requestClient.get<string[]>('/image/portal/image');
}
