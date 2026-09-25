<script setup lang="ts">
import { objectview } from 'feng3d';
import type { AttributeViewInfo } from 'feng3d';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
    name: string;
    owner: Record<string, unknown>;
    editable: boolean;
    attributeViewInfo?: AttributeViewInfo;
}>();

const containerRef = ref<HTMLElement | null>(null);
const views = ref<Array<{ dom?: HTMLElement; destroy?: () => void }>>([]);

// 获取属性值
const attributeValue = computed(() => props.owner[props.name]);

// 获取对象数组
const objects = computed(() => {
    const value = attributeValue.value;
    if (Array.isArray(value)) {
        return value;
    }
    return value ? [value] : [];
});

// 创建视图
function createViews() {
    // 清理旧视图
    views.value.forEach(view => {
        if (view.destroy) {
            view.destroy();
        }
    });
    views.value = [];

    if (!containerRef.value) return;

    // 创建新视图
    objects.value.forEach((element: any) => {
        let editable = props.editable;
        // TODO(P1 API 迁移)：`Feng3dObject` 已从主仓移除（对象/组件现为纯数据接口），
        // `hideFlags & HideFlags.NotEditable` 的只读判定改用 `__type__` 数据判别，待迁移后恢复。
        // if (element instanceof Feng3dObject) {
        //     editable = editable && !(element.hideFlags & HideFlags.NotEditable);
        // }
        const view = objectview.getObjectView(element, { editable }) as { dom?: HTMLElement; destroy?: () => void };
        if (view.dom && containerRef.value) {
            containerRef.value.appendChild(view.dom);
            views.value.push(view);
        }
    });
}

watch(() => attributeValue.value, () => {
    createViews();
}, { deep: true });

onMounted(() => {
    createViews();
});

onUnmounted(() => {
    views.value.forEach(view => {
        if (view.destroy) {
            view.destroy();
        }
    });
    views.value = [];
});
</script>

<template>
    <div ref="containerRef" class="oav-object-view"></div>
</template>

<style scoped>
.oav-object-view {
    width: 100%;
}
</style>
