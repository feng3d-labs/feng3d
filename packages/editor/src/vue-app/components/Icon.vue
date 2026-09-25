<template>
  <IconifyIcon :icon="icon" :class="iconClass" :style="iconStyle" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Icon as IconifyIcon } from '@iconify/vue';

interface Props {
  icon: string; // Iconify 图标名称，如 'mdi:home', 'material-symbols:settings'
  size?: number | string; // 图标大小，支持数字（px）或字符串（如 '1em', '24px'）
  color?: string; // 图标颜色
  class?: string; // 自定义类名
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  color: 'currentColor',
});

const iconClass = computed(() => {
  return props.class;
});

const iconStyle = computed(() => {
  const sizeValue = typeof props.size === 'number' ? `${props.size}px` : props.size;
  return {
    fontSize: sizeValue,
    color: props.color,
  };
});
</script>

