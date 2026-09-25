<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { AssetData, AudioAsset, ScriptAsset } from 'feng3d';
import type { Material, Geometry } from 'feng3d';
import { editorRS } from '../../../assets/EditorRS';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';
import { useEditorStore } from '../../stores/editorStore';
import { MenuAdapter } from '../../components/MenuAdapter';

/**
 * 按 `__type__` 命名约定判别已加载资源数据是否为材质。
 *
 * TODO(P1 API 迁移)：主仓 `ReadRS.getLoadedAssetDatasByType(type)` 用构造函数做
 * `instanceof` 过滤，而 `Material` / `Geometry` 已是**纯数据接口**（运行时无值、不可作构造器），
 * 该入口对二者失效，且主仓暂未提供 `isMaterial` / `isGeometry` 之类的 `__type__` 判别工具
 * （见 docs/API_MIGRATION.md §3.8 与本次迁移的能力缺口清单）。
 * 这里按主仓材质类型名统一以 `Material` 结尾的约定做判别，不实例化 logic（避免副作用）。
 * 待主仓提供判别工具后替换本实现。
 *
 * @param value 已加载的资源数据
 */
function isMaterialData(value: unknown): value is Material
{
    const type = (value as { __type__?: string } | undefined)?.__type__;

    return !!type && type.endsWith('Material');
}

/**
 * 按 `__type__` 命名约定判别已加载资源数据是否为几何体（同 {@link isMaterialData}）。
 *
 * @param value 已加载的资源数据
 */
function isGeometryData(value: unknown): value is Geometry
{
    const type = (value as { __type__?: string } | undefined)?.__type__;

    return !!type && type.endsWith('Geometry');
}

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
        // TODO(P1 API 迁移)：`Texture2D` 已从主仓移除，且 `getLoadedAssetDatasByType` 需要构造函数，
        // 待「已加载纹理枚举」新 API 提供后恢复候选纹理列表。
        /*
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
        */
    } else if (param.accepttype === 'texturecube') {
        // TODO(P1 API 迁移)：`TextureCube` 已从主仓移除，同上。
        /*
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
        */
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
        const assets = AssetData.getAllLoadedAssetDatas().filter(isMaterialData);
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
        const geometrys = AssetData.getAllLoadedAssetDatas().filter(isGeometryData);
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
