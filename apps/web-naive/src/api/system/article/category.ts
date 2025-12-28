import type { ArticlePage } from '#/api/system/article/article';

import { requestClient } from '#/api/request';

/**
 * 文章分类查询对象
 */
export interface CategoryQuery extends PageQuery {
  categoryName?: string;
}

/**
 * 文章分类表单
 * @returns
 */
export interface CategoryForm {
  categoryId?: string;
  categoryName?: string;
  icon?: string;
  sort?: number;
}

/**
 * 文章分类分页
 * @returns
 */
export interface CategoryPage {
  categoryId?: string;
  categoryName?: string;
  icon?: string;
  articleCount?: number;
  sort?: number;
  createTime?: Date;
  updateTime?: Date;
}

/**
 * 文章分类下拉选项
 */
export interface CategoryOption {
  id: string;
  value: string;
  label: string;
}

/**
 * 文章分类下拉选项
 */
export interface PortalCategory {
  id: string;
  value: string;
  label: string;
  articleList: ArticlePage[];
}

/**
 * 文章分类分页类型声明
 */
export type CategoryPageResult = PageResult<CategoryPage[]>;

/**
 * 文章分类分页列表
 * @returns
 * @param categoryQuery
 */
export async function selectCategoryPageApi(categoryQuery: CategoryQuery) {
  return requestClient.get<CategoryPageResult>('/category/page', {
    params: categoryQuery,
  });
}

/**
 * 新增文章分类
 * @param categoryForm
 */
export async function saveCategoryApi(categoryForm: CategoryForm) {
  return requestClient.post('/category/save', categoryForm);
}

/**
 * 编辑文章分类
 * @param categoryForm
 */
export async function updateCategoryApi(categoryForm: CategoryForm) {
  return requestClient.put('/category/update', categoryForm);
}

/**
 * 文章分类详情
 * @param {string} categoryId
 * @returns
 */
export async function getCategoryDetailApi(categoryId: string) {
  return requestClient.get<CategoryForm>(`/category/detail/${categoryId}`);
}

/**
 * 删除文章分类
 * @returns
 * @param categoryIds
 */
export async function deleteCategoryApi(categoryIds: string[]) {
  return requestClient.delete('/category/delete', categoryIds);
}

/**
 * 文章分类下拉选项
 */
export async function selectCategoryOptionApi() {
  return requestClient.get<CategoryOption[]>('/category/categoryList');
}

/**
 * 门户首页文章分类
 * @returns
 */
export async function selectPortalCategoryApi() {
  return requestClient.get<PortalCategory[]>(
    '/category/portal/categoryList',
  );
}
