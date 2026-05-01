<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Texture2D, TextureCube, AudioAsset, ScriptAsset, Material, Geometry, ReadRS } from 'feng3d';
import { editorRS } from '../../../assets/EditorRS';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';
import { useEditorStore } from '../../stores/editorStore';
import { MenuAdapter } from '../../components/MenuAdapter';

const props = defineProps<{
    name: string;
    owner: Record<string, unknown>;
    editable: boolean;
    attributeViewInfo?: any;
}>();

const editorStore = useEditorStore();

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

// 获取属性值
const attributeValue = computed(() => r_owner[props.name]);

// 显示文本
const displayText = computed(() => {
    const value = attributeValue.value;
    if (value === undefined || value === null) {
        return String(value);
    }
    if (typeof value === 'object' && value !== null) {
        return (value as any)['name'] || '';
    }
    return String(value);
});

// 是否可以双击选择
const canDoubleClick = computed(() => {
    const value = attributeValue.value;
    return value && typeof value === 'object';
});

// 选择按钮点击
function onPickClick() {
    const param = props.attributeViewInfo?.componentParam as { accepttype?: string; datatype?: string };
    if (!param?.accepttype) return;

    const menus: any[] = [];
    const menuAdapter = new MenuAdapter();

    if (param.accepttype === 'texture2d') {
        const texture2ds = editorRS.getLoadedAssetDatasByType(Texture2D);
        texture2ds.forEach((item) => {
            menus.push({
                label: item.name,
                click: () => {
                    r_owner[props.name] = item;
                    triggerValueChange();
                },
            });
        });
    } else if (param.accepttype === 'texturecube') {
        const textureCubes = editorRS.getLoadedAssetDatasByType(TextureCube);
        textureCubes.forEach((item) => {
            menus.push({
                label: item.name,
                click: () => {
                    r_owner[props.name] = item;
                    triggerValueChange();
                },
            });
        });
    } else if (param.accepttype === 'audio') {
        menus.push({
            label: 'None',
            click: () => {
                r_owner[props.name] = '';
                triggerValueChange();
            },
        });
        const audioFiles = editorRS.getAssetsByType(AudioAsset);
        audioFiles.forEach((item) => {
            menus.push({
                label: item.fileName,
                click: () => {
                    r_owner[props.name] = item.assetPath;
                    triggerValueChange();
                },
            });
        });
    } else if (param.accepttype === 'file_script') {
        menus.push({
            label: 'None',
            click: () => {
                r_owner[props.name] = null;
                triggerValueChange();
            },
        });
        const scriptFiles = editorRS.getAssetsByType(ScriptAsset);
        scriptFiles.forEach((element) => {
            menus.push({
                label: element.scriptName,
                click: () => {
                    r_owner[props.name] = element.scriptName;
                    triggerValueChange();
                },
            });
        });
    } else if (param.accepttype === 'material') {
        const assets = editorRS.getLoadedAssetDatasByType(Material);
        assets.forEach((element) => {
            menus.push({
                label: element.name,
                click: () => {
                    r_owner[props.name] = element;
                    triggerValueChange();
                },
            });
        });
    } else if (param.accepttype === 'geometry') {
        const geometrys = editorRS.getLoadedAssetDatasByType(Geometry);
        geometrys.forEach((element) => {
            menus.push({
                label: element.name,
                click: () => {
                    r_owner[props.name] = element;
                    triggerValueChange();
                },
            });
        });
    }

    if (menus.length > 0) {
        menuAdapter.popup(menus);
    }
}

// 触发值变化事件
function triggerValueChange() {
    if (props.attributeViewInfo) {
        const event = new ObjectViewEvent();
        event.type = ObjectViewEvent.VALUE_CHANGE;
        (event as any).space = r_owner;
        (event as any).attributeName = props.name;
        (event as any).attributeValue = r_owner[props.name];
    }
}

// 双击选择对象
function onDoubleClick() {
    const value = attributeValue.value;
    if (value && typeof value === 'object') {
        editorStore.selectObject(value as any);
    }
}
</script>

<template>
    <div class="oav-row oav-pick" @dblclick="canDoubleClick ? onDoubleClick() : null">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <div class="oav-pick-content">
                <span class="oav-pick-text">{{ displayText }}</span>
                <el-button
                    v-if="props.editable"
                    size="small"
                    text
                    @click.stop="onPickClick"
                >
                    选择
                </el-button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.oav-row {
    display: flex;
    align-items: center;
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
}

.oav-value {
    flex: 1;
    min-width: 0;
}

.oav-pick-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.oav-pick-text {
    flex: 1;
    font-size: 12px;
    color: var(--sideBar-foreground, #cccccc);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
