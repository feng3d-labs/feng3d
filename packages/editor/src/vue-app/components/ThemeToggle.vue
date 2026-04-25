<template>
  <el-button
    :icon="isDark ? MoonIcon : SunnyIcon"
    circle
    size="small"
    @click="toggleTheme"
    class="theme-toggle-btn"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore, type ThemeType } from '../stores/themeStore';
import { Moon as MoonIcon, Sunny as SunnyIcon } from '@element-plus/icons-vue';

const themeStore = useThemeStore();

const isDark = computed(() => themeStore.currentTheme === 'dark');

async function toggleTheme() {
  const newTheme: ThemeType = isDark.value ? 'light' : 'dark';
  await themeStore.setTheme(newTheme);
}
</script>

<style scoped>
.theme-toggle-btn {
  background-color: var(--list-hoverBackground);
  border: 1px solid var(--sideBar-border);
  color: var(--editor-foreground);
  transition: all 0.2s ease;
  margin-left: 8px;
}

.theme-toggle-btn:hover {
  background-color: var(--list-activeSelectionBackground);
  transform: translateY(-1px);
}

.theme-toggle-btn:deep(.el-icon) {
  font-size: 14px;
}
</style>