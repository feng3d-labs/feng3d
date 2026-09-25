<template>
    <div class="oav-row oav-minmax-curve">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <MinMaxCurveView
                :min-max-curve="minMaxCurve"
                :editable="props.editable"
                @change="onChange"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { MinMaxCurve } from 'feng3d';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';
import MinMaxCurveView from '../../components/MinMaxCurveView.vue';

const props = defineProps<{
    name: string;
    owner: Record<string, unknown>;
    editable: boolean;
    attributeViewInfo?: any;
}>();

// 在组件内部创建响应式对象
const r_owner = reactive(props.owner);

// 格式化标签名
const label = computed(() => {
    const name = props.attributeViewInfo?.label || props.name;
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
});

// 获取 MinMaxCurve
const minMaxCurve = computed(() => {
    return r_owner[props.name] as MinMaxCurve;
});

// 变化处理
function onChange() {
    // 触发值变化事件
    if (props.attributeViewInfo) {
        const event = new ObjectViewEvent();
        event.type = ObjectViewEvent.VALUE_CHANGE;
        (event as any).space = r_owner;
        (event as any).attributeName = props.name;
        (event as any).attributeValue = minMaxCurve.value;
    }
}
</script>

<style scoped>
.oav-row {
    display: flex;
    align-items: flex-start;
    padding: 4px 8px;
    min-height: 24px;
}

.oav-label {
    flex: 0 0 120px;
    font-size: 12px;
    color: var(--sideBar-foreground, #cccccc);
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-top: 4px;
}

.oav-value {
    flex: 1;
    min-width: 0;
}
</style>
