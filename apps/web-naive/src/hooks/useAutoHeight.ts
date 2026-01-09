import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * 获取当前页面高度, 用于动态计算高度
 * @param offset - 顶部和页脚总占高度px
 */
export function useAutoHeight(offset: number = 100) {
  const height = ref<number>(window.innerHeight - offset);
  let resizeTimer: null | number = null;

  const calculateHeight = () => {
    if (resizeTimer !== null) {
      clearTimeout(resizeTimer);
    }

    // 200ms 防抖
    resizeTimer = window.setTimeout(() => {
      height.value = window.innerHeight - offset;
      resizeTimer = null;
    }, 200);
  };

  const resizeHandler = () => {
    calculateHeight();
  };

  onMounted(() => {
    calculateHeight();
    window.addEventListener('resize', resizeHandler);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeHandler);
    if (resizeTimer !== null) {
      clearTimeout(resizeTimer);
    }
  });

  return height;
}
