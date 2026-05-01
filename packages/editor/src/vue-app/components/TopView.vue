<template>
  <div class="top-view">
    <!-- 菜单栏 -->
    <TopMenuBar />
  </div>
</template>

<script setup lang="ts">
import TopMenuBar from './TopMenuBar.vue';
</script>

<style scoped>
.top-view {
  position: relative;
  width: 100%;
  height: 32px;
  flex-shrink: 0;
  z-index: 1000;
  background-color: var(--editor-background);
  display: flex;
  flex-direction: column;
}
</style>
