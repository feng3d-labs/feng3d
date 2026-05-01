<template>
    <div class="minmax-curve-vector3-view">
        <div class="minmax-curve-vector3-item">
            <label class="minmax-curve-vector3-label">X:</label>
            <MinMaxCurveView
                :min-max-curve="minMaxCurveVector3.xCurve"
                :editable="editable"
                @change="onChange"
            />
        </div>
        <div class="minmax-curve-vector3-item">
            <label class="minmax-curve-vector3-label">Y:</label>
            <MinMaxCurveView
                :min-max-curve="minMaxCurveVector3.yCurve"
                :editable="editable"
                @change="onChange"
            />
        </div>
        <div class="minmax-curve-vector3-item">
            <label class="minmax-curve-vector3-label">Z:</label>
            <MinMaxCurveView
                :min-max-curve="minMaxCurveVector3.zCurve"
                :editable="editable"
                @change="onChange"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { MinMaxCurveVector3, watcher } from 'feng3d';
import MinMaxCurveView from './MinMaxCurveView.vue';

const props = withDefaults(defineProps<{
    minMaxCurveVector3: MinMaxCurveVector3;
    editable?: boolean;
}>(), {
    editable: true,
});

const emit = defineEmits<{
    change: [];
}>();

// 变化处理
function onChange() {
    emit('change');
}

// 监听 MinMaxCurveVector3 变化
function onMinMaxCurveVector3Changed() {
    // 子组件会自动更新，这里只需要触发 change 事件
    emit('change');
}

// 监听各个曲线变化
watch(() => props.minMaxCurveVector3.xCurve, onMinMaxCurveVector3Changed, { deep: true });
watch(() => props.minMaxCurveVector3.yCurve, onMinMaxCurveVector3Changed, { deep: true });
watch(() => props.minMaxCurveVector3.zCurve, onMinMaxCurveVector3Changed, { deep: true });
</script>

<style scoped>
.minmax-curve-vector3-view {
    padding: 4px 0;
}

.minmax-curve-vector3-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 4px;
}

.minmax-curve-vector3-label {
    flex: 0 0 20px;
    font-size: 12px;
    color: var(--editor-foreground, #cccccc);
    padding-top: 4px;
}
</style>
