declare global {
  /**
   * 分页查询参数
   */
  interface PageQuery {
    page: number;

    limit: number;
  }

  /**
   * 分页响应对象
   */
  interface PageResult<T> {
    // 数据源
    list: T;

    // 总数
    total: number;
  }

  /**
   * 下拉组件
   */
  interface OptionType {
    // 值
    value: number | string;

    // 文本
    label: string;

    // 子列表
    children?: OptionType[];
  }

  /**
   * 树组件
   */
  interface Tree {
    id: number | string;
    label: string;
    children?: Tree[];
  }

  /**
   * 穿梭框组件
   */
  interface TransferVO {
    key: string;
    label: string;
  }

  /**
   * 批量导入结果
   */
  interface ImportResult {
    validCount: number;
    invalidCount: number;
  }
}

export {};
