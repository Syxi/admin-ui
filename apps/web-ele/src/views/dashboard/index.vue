<script lang="ts" setup>
</script>

<template>
  <div class="dashboard">
    <h1 class="page-title">欢迎回来</h1>
    <p class="page-subtitle">这里是最新的系统概览</p>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  min-height: calc(100vh - 100px);
  background-color: #f8fafc;
  padding: 20px;
}

.dashboard::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 20%),
    radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 20%);
  z-index: 0;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 18px;
  color: #64748b;
  font-weight: 400;
  line-height: 1.5;
  max-width: 500px;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 15px;
  }

  .page-title {
    font-size: 28px;
    margin-bottom: 12px;
  }

  .page-subtitle {
    font-size: 16px;
  }
}
</style>
