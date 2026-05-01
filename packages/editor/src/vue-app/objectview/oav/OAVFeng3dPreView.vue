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
import { windowEventProxy, ticker, Vector2, Vector3, GameObject, Geometry, Material } from 'feng3d';
import { Feng3dScreenShot } from '../../../feng3d/Feng3dScreenShot';

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
    return r_owner[props.name] as GameObject | Geometry | Material;
});

const previewContainerRef = ref<HTMLElement | null>(null);
const previewImageRef = ref<HTMLImageElement | null>(null);
const previewSize = ref(200);
const previewImageSrc = ref('');
const cameraRotation = ref(new Vector3(20, -90, 0));
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
    
    const feng3dScreenShot = Feng3dScreenShot.feng3dScreenShot;
    const X_AXIS = feng3dScreenShot.camera.transform.matrix.getAxisX();
    const Y_AXIS = feng3dScreenShot.camera.transform.matrix.getAxisY();
    
    feng3dScreenShot.camera.transform.rotate(X_AXIS, deltaY);
    feng3dScreenShot.camera.transform.rotate(Y_AXIS, deltaX);
    
    cameraRotation.value = feng3dScreenShot.camera.transform.rotation.clone();
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
    if (!previewObject.value) return;
    
    const feng3dScreenShot = Feng3dScreenShot.feng3dScreenShot;
    
    if (previewObject.value instanceof GameObject) {
        feng3dScreenShot.drawGameObject(previewObject.value, cameraRotation.value);
    } else if (previewObject.value instanceof Geometry) {
        feng3dScreenShot.drawGeometry(previewObject.value as any, cameraRotation.value);
    } else if (previewObject.value instanceof Material) {
        feng3dScreenShot.drawMaterial(previewObject.value, cameraRotation.value);
    }
    
    const dataURL = feng3dScreenShot.toDataURL(previewSize.value, previewSize.value);
    if (dataURL) {
        previewImageSrc.value = dataURL;
    }
}

// 监听尺寸变化
const resizeObserver = ref<ResizeObserver | null>(null);

onMounted(() => {
    // 初始化相机旋转
    const feng3dScreenShot = Feng3dScreenShot.feng3dScreenShot;
    cameraRotation.value = feng3dScreenShot.camera.transform.rotation.clone();
    
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
