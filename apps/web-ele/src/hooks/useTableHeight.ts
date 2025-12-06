import { computed, onMounted, onUnmounted, ref } from 'vue';

/**
 * 自定义 Hook：动态计算数据表格高度
 * 适用于不使用 el-card 包装的页面
 *
 * @param formRef - 查询表单的 ref
 * @param options - 配置项
 * @param options.offsetBottom - 底部预留空间（px）
 * @param options.headerHeight - 页面头部高度（px）
 * @param options.tableOffset - 表格高度偏移量（px）
 */
export function useTableHeight(
  formRef?: any,
  {
    offsetBottom = 10,
    headerHeight = 110,
    tableOffset = -70,
  }: {
    offsetBottom?: number;
    headerHeight?: number;
    tableOffset?: number;
  } = {}
) {
  // 表单高度
  const formHeight = ref(0);
  
  // 创建 ResizeObserver 实例
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      if (entry.contentBoxSize) {
        // 使用 requestAnimationFrame 保证在渲染前计算
        requestAnimationFrame(() => {
          updateHeight();
        });
      }
    }
  });

  /**
   * 核心高度计算方法
   * 计算逻辑：
   * 1. 获取查询表单的高度
   * 2. 计算可用高度 = 视口高度 - 头部高度 - 表单高度 - 底部留白
   */
  const updateHeight = () => {
    if (formRef?.value?.$el) {
      // 获取表单元素的实际高度
      formHeight.value = formRef.value.$el.offsetHeight;
    }
  };

  /**
   * 计算表格高度
   * 计算逻辑：可用高度 + 偏移量（支持正负值）
   */
  const tableHeight = computed(() => {
    // 计算可用高度
    const availableHeight = window.innerHeight - 
      formHeight.value - 
      offsetBottom - 
      headerHeight;
      
    return availableHeight + tableOffset;
  });

  // 组件挂载生命周期
  onMounted(() => {
    // 初始化观察者
    if (document.body) {
      resizeObserver.observe(document.body);
    }

    // 初始计算高度
    updateHeight();

    // 添加 resize 事件监听（作为后备方案）
    window.addEventListener('resize', updateHeight, { passive: true });
  });

  // 组件卸载生命周期
  onUnmounted(() => {
    // 清理观察者
    resizeObserver.disconnect();

    // 移除事件监听
    window.removeEventListener('resize', updateHeight);
  });

  // 返回结果
  return { tableHeight };
}
