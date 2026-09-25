<template>
    <div class="oav-row oav-feng3d-preview">
        <label class="oav-label" :title="props.name">{{ label }}</label>
        <div class="oav-value">
            <div
                ref="previewContainerRef"
                class="feng3d-preview-container"
                :style="{ width: previewSize + 'px', height: previewSize + 'px' }"
                @mousedown="onMouseDown"
            >
                <img
                    ref="previewImageRef"
                    class="feng3d-preview-image"
                    :src="previewImageSrc"
                    :style="{ width: previewSize + 'px', height: previewSize + 'px' }"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue';
import { windowEventProxy, ticker, Vector2, logic as getLogic } from 'feng3d';
import type { Object3D, GeometryLike, Material } from 'feng3d';
import { Feng3dScreenShot } from '../../../feng3d/Feng3dScreenShot';
import { setWorldMatrix } from '../../../scripts/iconUtils';

/**
 * 判断预览数据是否为 Object3D。
 *
 * `Object3D` 已是纯数据接口（运行时无值），不能用 `instanceof`，改用 `__type__` 判别。
 */
function isObject3DData(value: unknown): value is Object3D
{
    return (value as { __type__?: string } | undefined)?.__type__ === 'Object3D';
}

/**
 * 判断预览数据是否为几何体。
 *
 * TODO(P1 API 迁移)：主仓未提供 `isGeometry` / `isMaterial` 运行时判别工具，
 * 这里按类型名后缀约定判别（与 `OAVPick` 的处理一致，见 docs/API_MIGRATION.md §3.8）。
 */
function isGeometryData(value: unknown): value is GeometryLike
{
    const type = (value as { __type__?: string } | undefined)?.__type__;

    return !!type && type.endsWith('Geometry');
}

/** 判断预览数据是否为材质（同 {@link isGeometryData}） */
function isMaterialData(value: unknown): value is Material
{
    const type = (value as { __type__?: string } | undefined)?.__type__;

    return !!type && type.endsWith('Material');
}

/**
 * 取预览相机（`Feng3dScreenShot.camera`）的宿主对象。
 *
 * `Camera` 是纯数据组件，`camera.transform` 已删除（无独立 Transform 对象），
 * 变换一律经宿主对象 `logic(object3D)` 读取。
 */
function getPreviewCameraObject(): Object3D | null
{
    const camera = Feng3dScreenShot.feng3dScreenShot.camera;
    if (!camera) return null;

    return (getLogic(camera).entity as Object3D | null) ?? null;
}

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

// 获取预览对象
const previewObject = computed(() => {
    return r_owner[props.name] as Object3D | GeometryLike | Material;
});

const previewContainerRef = ref<HTMLElement | null>(null);
const previewImageRef = ref<HTMLImageElement | null>(null);
const previewSize = ref(200);
const previewImageSrc = ref('');
const isDragging = ref(false);
const preMousePos = ref<Vector2 | null>(null);

// 鼠标按下
function onMouseDown(event: MouseEvent) {
    if (!props.editable) return;
    
    const rect = previewContainerRef.value?.getBoundingClientRect();
    if (!rect) return;
    
    const mousePos = new Vector2(event.clientX, event.clientY);
    if (rect.left <= mousePos.x && mousePos.x <= rect.right &&
        rect.top <= mousePos.y && mousePos.y <= rect.bottom) {
        isDragging.value = true;
        preMousePos.value = mousePos;
        
        windowEventProxy.on('mousemove', onMouseMove);
        windowEventProxy.on('mouseup', onMouseUp);
    }
}

// 鼠标移动（旋转相机）
function onMouseMove() {
    if (!isDragging.value || !preMousePos.value) return;
    
    const mousePos = new Vector2(windowEventProxy.clientX, windowEventProxy.clientY);
    const deltaX = mousePos.x - preMousePos.value.x;
    const deltaY = mousePos.y - preMousePos.value.y;
    
    // 相机旋转直接作用于预览相机的宿主对象：
    // 旧写法 `logic(camera.transform).rotate(axis, angle)` 已废除（无 Transform、无 rotate 方法），
    // 改为「世界矩阵追加绕世界轴旋转 → setWorldMatrix 分解 TRS 写回」（同 SceneView 的处理）。
    const cameraObject = getPreviewCameraObject();
    if (cameraObject) {
        const cameraLogic = getLogic(cameraObject);
        const X_AXIS = cameraLogic.local2world.getAxisX();
        const Y_AXIS = cameraLogic.local2world.getAxisY();

        const world = cameraLogic.local2world.clone();
        world.appendRotation(X_AXIS, deltaY);
        world.appendRotation(Y_AXIS, deltaX);
        setWorldMatrix(cameraObject, world);
    }
    preMousePos.value = mousePos;
    
    // 立即更新预览
    drawObject();
}

// 鼠标抬起
function onMouseUp() {
    isDragging.value = false;
    preMousePos.value = null;
    windowEventProxy.off('mousemove', onMouseMove);
    windowEventProxy.off('mouseup', onMouseUp);
}

// 绘制对象
function drawObject() {
    const preview = previewObject.value;
    if (!preview) return;
    
    const feng3dScreenShot = Feng3dScreenShot.feng3dScreenShot;
    
    // 旧写法用 `instanceof Object3D / Geometry / Material` 判别：三者在新范式中都是纯数据接口
    // （运行时无值），改为 `__type__` 判别。
    // `drawXxx` 的相机旋转参数已随旧命令式渲染路径移除（旋转直接作用于预览相机宿主对象）。
    // TODO(P1 API 迁移)：`Feng3dScreenShot.drawObject3D / drawGeometry / drawMaterial / toDataURL`
    // 目前是待迁移桩（抛错），待其按新范式恢复后本函数即产出预览图。
    if (isObject3DData(preview)) {
        feng3dScreenShot.drawObject3D(preview);
    } else if (isGeometryData(preview)) {
        feng3dScreenShot.drawGeometry(preview);
    } else if (isMaterialData(preview)) {
        feng3dScreenShot.drawMaterial(preview);
    }
    
    const dataURL = feng3dScreenShot.toDataURL(previewSize.value, previewSize.value);
    if (dataURL) {
        previewImageSrc.value = dataURL;
    }
}

// 监听尺寸变化
const resizeObserver = ref<ResizeObserver | null>(null);

onMounted(() => {
    
    // 监听容器尺寸
    if (previewContainerRef.value) {
        resizeObserver.value = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                if (width > 0) {
                    previewSize.value = width;
                    nextTick(() => {
                        drawObject();
                    });
                }
            }
        });
        resizeObserver.value.observe(previewContainerRef.value);
        
        // 初始尺寸
        const rect = previewContainerRef.value.getBoundingClientRect();
        if (rect.width > 0) {
            previewSize.value = rect.width;
        }
    }
    
    // 定时更新预览
    ticker.on(100, drawObject);
    
    // 初始绘制
    nextTick(() => {
        drawObject();
    });
});

onUnmounted(() => {
    if (resizeObserver.value) {
        resizeObserver.value.disconnect();
    }
    
    ticker.off(100, drawObject);
    
    windowEventProxy.off('mousemove', onMouseMove);
    windowEventProxy.off('mouseup', onMouseUp);
});

// 监听对象变化
watch(() => previewObject.value, () => {
    nextTick(() => {
        drawObject();
    });
}, { deep: true });
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
    color: var(--editor-foreground, #cccccc);
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

.feng3d-preview-container {
    position: relative;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    background-color: var(--input-background, #1d1d1d);
    cursor: grab;
    user-select: none;
}

.feng3d-preview-container:active {
    cursor: grabbing;
}

.feng3d-preview-image {
    display: block;
    object-fit: contain;
}
</style>
