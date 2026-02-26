import { requestClient } from '#/api/request';

/**
 * 笔记查询对象
 */
export interface NoteQuery extends PageQuery {
  // 笔记标题
  title?: string;

  // 笔记内容
  content?: string;
}

/**
 * 笔记分页对象
 */
export interface NotePage {
  // 笔记ID
  noteId?: string;

  // 笔记标题
  title: string;

  // 笔记内容
  content: string;

  // 状态(1:正常; -1:禁用)
  status?: number;

  // 创建时间
  createTime?: string;

  // 更新时间
  updateTime?: string;
}

export type NotePageResult = PageResult<NotePage[]>;

/**
 * 编辑、新增表单笔记
 */
export interface NoteForm {
  // 笔记ID
  noteId?: string;

  // 笔记标题
  title: string;

  // 笔记内容
  content: string;

  // 状态(1:正常; -1:禁用)
  status?: number;
}

/**
 * 获取笔记分页列表
 * @returns
 * @param noteQuery
 */
export async function selectNotePageApi(noteQuery: NoteQuery) {
  return requestClient.get<NotePageResult>('/api/note/page', {
    params: noteQuery,
  });
}

/**
 * 获取笔记详情
 * @param noteId
 */
export async function getNoteDetailApi(noteId: string) {
  return requestClient.get<NoteForm>(`/api/note/detail/${noteId}`);
}

/**
 * 新增笔记
 * @returns
 * @param noteForm
 */
export async function addNoteApi(noteForm: NoteForm) {
  return requestClient.post('/api/note/add', noteForm);
}

/**
 * 编辑笔记
 * @returns
 * @param noteForm
 */
export async function editNoteApi(noteForm: NoteForm) {
  return requestClient.put('/api/note/edit', noteForm);
}

/**
 * 删除笔记
 * @param noteIds
 * @returns
 */
export async function deleteNoteApi(noteIds: string[]) {
  return requestClient.delete('/api/note/delete', noteIds);
}
