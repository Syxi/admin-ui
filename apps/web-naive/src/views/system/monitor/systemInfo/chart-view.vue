<script setup lang="ts">
import type { SystemInfoVO } from '#/api/system/sys/systemInfo';

import { h, onMounted, ref } from 'vue';
import { useEcharts } from '@vben/plugins/echarts';

import { getSystemInfo } from '#/api/system/sys/systemInfo';

// 引入ECharts组件
import { EchartsUI } from '@vben/plugins/echarts';
import { NRow, NCol, NCard, NDataTable, NProgress } from 'naive-ui';

const systemInfo = ref<SystemInfoVO>();

// 图表引用
const memoryChartRef = ref();
const diskChartRef = ref();
const cpuChartRef = ref();

// 初始化图表
const { renderEcharts: renderMemoryChart } = useEcharts(memoryChartRef);
const { renderEcharts: renderDiskChart } = useEcharts(diskChartRef);
const { renderEcharts: renderCpuChart } = useEcharts(cpuChartRef);

// 获取系统信息
onMounted(async () => {
  systemInfo.value = await getSystemInfo();
  
  // 渲染内存图表
  renderMemoryChart(getMemoryChartOption() as any);
  
  // 渲染磁盘图表
  renderDiskChart(getDiskChartOption() as any);
  
  // 渲染CPU图表
  renderCpuChart(getCpuChartOption() as any);
});

// 内存使用图表配置
const getMemoryChartOption = () => {
  if (!systemInfo.value) return {};
  
  const usedMemory = systemInfo.value.usedMemory || 0;
  const freeMemory = systemInfo.value.freeMemory || 0;
  const totalMemory = systemInfo.value.totalMemory || (usedMemory + freeMemory);
  
  return {
    title: {
      text: '内存使用情况',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}GB ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '内存',
        type: 'pie',
        radius: '70%',
        data: [
          { value: usedMemory, name: `已使用: ${usedMemory.toFixed(2)}GB` },
          { value: freeMemory, name: `空闲: ${freeMemory.toFixed(2)}GB` }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
};

// 磁盘空间图表配置
const getDiskChartOption = () => {
  if (!systemInfo.value || !systemInfo.value.disks) return {};
  
  const diskNames = systemInfo.value.disks.map(disk => disk.name);
  const usedSpaces = systemInfo.value.disks.map(disk => disk.usedSpace || 0);
  const freeSpaces = systemInfo.value.disks.map(disk => disk.freeSpace || 0);
  
  return {
    title: {
      text: '磁盘空间使用情况',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const used = params[0];
        const free = params[1];
        const total = used.value + free.value;
        const percent = ((used.value / total) * 100).toFixed(2);
        return `${used.name}<br/>
                已使用: ${used.value.toFixed(2)}GB<br/>
                空闲: ${free.value.toFixed(2)}GB<br/>
                总计: ${total.toFixed(2)}GB<br/>
                使用率: ${percent}%`;
      }
    },
    legend: {
      data: ['已使用', '空闲'],
      bottom: '0%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: diskNames
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '容量 (GB)'
      }
    ],
    series: [
      {
        name: '已使用',
        type: 'bar',
        stack: '容量',
        emphasis: {
          focus: 'series'
        },
        data: usedSpaces
      },
      {
        name: '空闲',
        type: 'bar',
        stack: '容量',
        emphasis: {
          focus: 'series'
        },
        data: freeSpaces
      }
    ]
  };
};

// CPU负载图表配置 (仪表盘)
const getCpuChartOption = () => {
  if (!systemInfo.value) return {};
  
  const cpuLoad = systemInfo.value.cpuLoad || 0;
  const cpuPercent = Math.min(Math.max(cpuLoad * 100, 0), 100); // 转换为百分比并限制在0-100之间
  
  return {
    title: {
      text: 'CPU负载',
      left: 'center'
    },
    series: [
      {
        type: 'gauge',
        progress: {
          show: true
        },
        axisLine: {
          lineStyle: {
            width: 15
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          length: 15,
          lineStyle: {
            width: 2,
            color: '#999'
          }
        },
        axisLabel: {
          distance: 25,
          color: '#999',
          fontSize: 10
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 18,
          itemStyle: {
            borderWidth: 8
          }
        },
        title: {
          show: false
        },
        detail: {
          valueAnimation: true,
          fontSize: 20,
          offsetCenter: [0, '70%']
        },
        data: [
          {
            value: cpuPercent.toFixed(1),
            name: 'CPU使用率 (%)'
          }
        ]
      }
    ]
  };
};

// 定义磁盘表格列
const diskColumns = [
  {
    title: '磁盘名称',
    key: 'name',
    width: 150
  },
  {
    title: '挂载点',
    key: 'mountPoint',
    width: 200
  },
  {
    title: '总容量(GB)',
    key: 'totalSpace',
    width: 120,
    render(row: any) {
      return row.totalSpace?.toFixed(2);
    }
  },
  {
    title: '已使用(GB)',
    key: 'usedSpace',
    width: 120,
    render(row: any) {
      return row.usedSpace?.toFixed(2);
    }
  },
  {
    title: '空闲(GB)',
    key: 'freeSpace',
    width: 120,
    render(row: any) {
      return row.freeSpace?.toFixed(2);
    }
  },
  {
    title: '使用率',
    key: 'usageRate',
    width: 120,
    render(row: any) {
      const usageRate = row.totalSpace ? Math.round((row.usedSpace / row.totalSpace) * 100) : 0;
      return h(NProgress, {
        percentage: usageRate,
        status: usageRate > 80 ? 'error' : 'success'
      });
    }
  }
];
</script>

<template>
  <div class="app-container">
    <!-- 系统概览卡片 -->
    <NRow :gutter="20" class="mb-5">
      <NCol :xs="24" :sm="12" :md="8">
        <NCard :bordered="false" class="system-info-card">
          <div>
            <h4>操作系统</h4>
            <p><strong>系统类型:</strong> {{ systemInfo?.osName }}</p>
            <p><strong>系统版本:</strong> {{ systemInfo?.osVersion }}</p>
            <p><strong>系统架构:</strong> {{ systemInfo?.osArch }}</p>
          </div>
        </NCard>
      </NCol>
      
      <NCol :xs="24" :sm="12" :md="8">
        <NCard :bordered="false" class="system-info-card">
          <div>
            <h4>内存信息</h4>
            <p><strong>总内存:</strong> {{ systemInfo?.totalMemory?.toFixed(2) }} GB</p>
            <p><strong>已使用:</strong> {{ systemInfo?.usedMemory?.toFixed(2) }} GB</p>
            <p><strong>空闲内存:</strong> {{ systemInfo?.freeMemory?.toFixed(2) }} GB</p>
          </div>
        </NCard>
      </NCol>
      
      <NCol :xs="24" :sm="12" :md="8">
        <NCard :bordered="false" class="system-info-card">
          <div>
            <h4>CPU信息</h4>
            <p><strong>CPU负载:</strong> {{ (systemInfo?.cpuLoad || 0).toFixed(2) }}</p>
            <p><strong>使用率:</strong> {{ ((systemInfo?.cpuLoad || 0) * 100).toFixed(1) }}%</p>
          </div>
        </NCard>
      </NCol>
    </NRow>
    
    <!-- 图表区域 -->
    <NRow :gutter="20">
      <!-- 内存使用饼图 -->
      <NCol :xs="24" :sm="12" :md="8">
        <NCard :bordered="false" class="chart-card">
          <EchartsUI ref="memoryChartRef" style="height: 300px;" />
        </NCard>
      </NCol>
      
      <!-- CPU负载仪表盘 -->
      <NCol :xs="24" :sm="12" :md="8">
        <NCard :bordered="false" class="chart-card">
          <EchartsUI ref="cpuChartRef" style="height: 300px;" />
        </NCard>
      </NCol>
      
      <!-- 磁盘空间柱状图 -->
      <NCol :xs="24" :sm="12" :md="8">
        <NCard :bordered="false" class="chart-card">
          <EchartsUI ref="diskChartRef" style="height: 300px;" />
        </NCard>
      </NCol>
    </NRow>
    
    <!-- 磁盘详情 -->
    <NCard :bordered="false" class="mt-5 disk-detail-card">
      <template #header>
        <div class="card-header">
          <span>磁盘详情</span>
        </div>
      </template>
      <NDataTable 
        :data="systemInfo?.disks || []" 
        :columns="diskColumns"
      />
    </NCard>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
}

.system-info-card,
.chart-card,
.disk-detail-card {
  margin-bottom: 20px;
}

.system-info-card h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #409eff;
  font-size: 18px;
}

.system-info-card p {
  margin: 8px 0;
  font-size: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.disk-table {
  width: 100%;
}

@media (max-width: 768px) {
  .app-container {
    padding: 10px;
  }
  
  .system-info-card,
  .chart-card {
    margin-bottom: 15px;
  }
  
  .system-info-card h4 {
    font-size: 16px;
  }
  
  .system-info-card p {
    font-size: 13px;
  }
}
</style>