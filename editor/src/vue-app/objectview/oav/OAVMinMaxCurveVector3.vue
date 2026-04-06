<template>
    <div class="oav-row oav-minmax-curve-vector3">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <MinMaxCurveVector3View
                :min-max-curve-vector3="minMaxCurveVector3"
                :editable="props.editable"
                @change="onChange"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { MinMaxCurveVector3 } from 'feng3d';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';
import MinMaxCurveVector3View from '../../components/MinMaxCurveVector3View.vue';

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

// 获取 MinMaxCurveVector3
const minMaxCurveVector3 = computed(() => {
    return r_owner[props.name] as MinMaxCurveVector3;
});

// 变化处理
function onChange() {
    // 触发值变化事件
    if (props.attributeViewInfo) {
        const event = new ObjectViewEvent();
        event.type = ObjectViewEvent.VALUE_CHANGE;
        (event as any).space = r_owner;
        (event as any).attributeName = props.name;
        (event as any).attributeValue = minMaxCurveVector3.value;
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
