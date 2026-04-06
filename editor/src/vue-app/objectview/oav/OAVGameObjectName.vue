<script setup lang="ts">
import { computed, reactive } from 'vue';
import { GameObject } from 'feng3d';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';
import { useI18n } from '../../composables/useI18n';

const props = defineProps<{
    name: string;
    owner: Record<string, unknown>;
    editable: boolean;
    attributeViewInfo?: any;
}>();

// 在组件内部创建响应式对象
const r_owner = reactive(props.owner);

// 获取 GameObject
const gameObject = computed(() => r_owner as unknown as GameObject);
const { t } = useI18n();

// 格式化标签名
const label = computed(() => {
    const name = props.attributeViewInfo?.label || props.name;
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
});

// 对象名称
const objectName = computed(() => gameObject.value?.name || '');

// 可见性
const visible = computed(() => gameObject.value?.activeSelf ?? true);

// 鼠标启用
const mouseEnabled = computed(() => gameObject.value?.mouseEnabled ?? false);

// 名称变化处理
function onNameChange(newValue: string) {
    if (gameObject.value) {
        gameObject.value.name = newValue;
        
        // 触发值变化事件
        if (props.attributeViewInfo) {
            const event = new ObjectViewEvent();
            event.type = ObjectViewEvent.VALUE_CHANGE;
            (event as any).space = r_owner;
            (event as any).attributeName = 'name';
            (event as any).attributeValue = newValue;
        }
    }
}

// 可见性变化处理
function onVisibleChange(newValue: boolean) {
    if (gameObject.value) {
        gameObject.value.activeSelf = newValue;
        
        // 触发值变化事件
        if (props.attributeViewInfo) {
            const event = new ObjectViewEvent();
            event.type = ObjectViewEvent.VALUE_CHANGE;
            (event as any).space = r_owner;
            (event as any).attributeName = 'activeSelf';
            (event as any).attributeValue = newValue;
        }
    }
}

// 鼠标启用变化处理
function onMouseEnabledChange(newValue: boolean) {
    if (gameObject.value) {
        gameObject.value.mouseEnabled = newValue;
        
        // 触发值变化事件
        if (props.attributeViewInfo) {
            const event = new ObjectViewEvent();
            event.type = ObjectViewEvent.VALUE_CHANGE;
            (event as any).space = r_owner;
            (event as any).attributeName = 'mouseEnabled';
            (event as any).attributeValue = newValue;
        }
    }
}
</script>

<template>
    <div class="oav-gameobject-name">
        <div class="oav-row">
            <label class="oav-label">{{ t('object.name') }}</label>
            <div class="oav-value">
                <el-input
                    :model-value="objectName"
                    :disabled="!props.editable"
                    size="small"
                    @update:model-value="onNameChange"
                    @blur="onNameChange"
                />
            </div>
        </div>
        <div class="oav-row">
            <label class="oav-label">{{ t('object.visible') }}</label>
            <div class="oav-value">
                <el-switch
                    :model-value="visible"
                    :disabled="!props.editable"
                    @update:model-value="onVisibleChange"
                />
            </div>
        </div>
        <div class="oav-row">
            <label class="oav-label">{{ t('object.mouseEnabled') }}</label>
            <div class="oav-value">
                <el-switch
                    :model-value="mouseEnabled"
                    :disabled="!props.editable"
                    @update:model-value="onMouseEnabledChange"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.oav-gameobject-name {
    padding: 4px 0;
}

.oav-row {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    min-height: 24px;
}

.oav-label {
    flex: 0 0 120px;
    font-size: 12px;
    color: var(--editor-foreground, #cccccc);
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.oav-value {
    flex: 1;
    min-width: 0;
}
</style>
