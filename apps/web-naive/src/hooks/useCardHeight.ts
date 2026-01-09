import { computed, onMounted, onUnmounted, ref } from 'vue';

/**
 * 自定义 Hook：动态计算数据表格卡片区域高度（优化版）
 * 放弃IE11支持后的现代浏览器优化方案
 *
 * 主要优化点：
 * 1. 使用 ResizeObserver 监听布局变化
 * 2. 使用 requestAnimationFrame 优化渲染性能
 * 3. 使用 CSS 变量动态管理高度值
 * 4. 简化防抖逻辑，提升计算效率
 *
 * @param cardFormRef - 第一个 el-card 的 ref
 * @param options - 配置项
 * @param options.offsetBottom - 底部预留空间（px）
 * @param options.headerHeight - 页面头部高度（px）
 * @param options.tableOffset - 表格高度偏移量（px）
 */
export function useCardHeight(
  cardFormRef?: any,
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
  // 使用 CSS 变量替代直接字符串拼接
  const cardHeight = ref('auto');

  // 缓存 body 元素
  const bodyEl = ref<HTMLElement | null>(null);

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
   * 1. 获取第一个卡片的 body 高度
   * 2. 计算可用高度 = 视口高度 - 头部高度 - 卡片 body 高度 - 底部留白
   */
  const updateHeight = () => {
    if (!cardFormRef.value?.$el) return;

    // 首次获取 body 元素
    if (!bodyEl.value) {
      bodyEl.value = cardFormRef.value.$el.querySelector('.el-card__body');
    }

    if (bodyEl.value) {
      // 设置 CSS 变量供样式使用
      document.body.style.setProperty('--header-height', `${headerHeight}px`);
      document.body.style.setProperty('--footer-offset', `${offsetBottom}px`);

      // 计算可用高度
      const availableHeight = window.innerHeight -
        bodyEl.value.offsetHeight -
        offsetBottom -
        headerHeight;

      // 设置卡片高度
      cardHeight.value = `${availableHeight}px`;
    }
  };

  /**
   * 基于卡片高度计算表格高度
   * 计算逻辑：卡片高度 + 偏移量（支持正负值）
   */
  const tableHeight = computed(() => {
    const heightNum = Number.parseInt(cardHeight.value, 10);
    return isNaN(heightNum) ? null : heightNum + tableOffset;
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

    // 清理 CSS 变量
    document.body.style.removeProperty('--header-height');
    document.body.style.removeProperty('--footer-offset');
  });

  // 返回结果保持原有接口
  return { cardHeight, tableHeight };
}
