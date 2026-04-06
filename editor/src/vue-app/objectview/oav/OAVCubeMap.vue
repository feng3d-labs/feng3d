<script setup lang="ts">
import { computed, reactive, onMounted, ref, watch } from 'vue';
import { TextureCube, Texture2D, ReadRS, dataTransform, objectEmitter } from 'feng3d';
import { ObjectViewEvent } from '../../../objectview/events/ObjectViewEvent';
import { MenuAdapter } from '../../components/MenuAdapter';

const props = defineProps<{
    name: string;
    owner: Record<string, unknown>;
    editable: boolean;
    attributeViewInfo?: any;
}>();

// 在组件内部创建响应式对象
const r_owner = reactive(props.owner);

// 获取 TextureCube
const textureCube = computed(() => r_owner as unknown as TextureCube);

// 格式化标签名
const label = computed(() => {
    const name = props.attributeViewInfo?.label || props.name;
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
});

// 立方体贴图的六个面
const faces = [
    { name: 'px', label: 'PX', property: 'positive_x_url' },
    { name: 'py', label: 'PY', property: 'positive_y_url' },
    { name: 'pz', label: 'PZ', property: 'positive_z_url' },
    { name: 'nx', label: 'NX', property: 'negative_x_url' },
    { name: 'ny', label: 'NY', property: 'negative_y_url' },
    { name: 'nz', label: 'NZ', property: 'negative_z_url' },
];

// 图片源
const imageSources = ref<Record<string, string | null>>({});

// 容器宽度（用于计算布局）
const containerWidth = ref(200);

// 更新图片
async function updateImage(faceIndex: number) {
    if (!textureCube.value) return;
    
    const face = faces[faceIndex];
    try {
        const img = await textureCube.value.getTextureImage(TextureCube.ImageNames[faceIndex]);
        if (img) {
            imageSources.value[face.name] = dataTransform.imageToDataURL(img);
        } else {
            imageSources.value[face.name] = null;
        }
    } catch (e) {
        imageSources.value[face.name] = null;
    }
}

// 初始化所有图片
async function initImages() {
    for (let i = 0; i < faces.length; i++) {
        await updateImage(i);
    }
}

// 点击图片按钮
function onImageClick(faceIndex: number) {
    if (!props.editable || !textureCube.value) return;
    
    const texture2ds = ReadRS.rs.getLoadedAssetDatasByType(Texture2D);
    const menus: any[] = [{
        label: 'None',
        click: async () => {
            textureCube.value.setTexture2D(TextureCube.ImageNames[faceIndex], null);
            await updateImage(faceIndex);
            dispatchValueChange(faceIndex);
        },
    }];
    
    texture2ds.forEach((d) => {
        menus.push({
            label: d.name,
            click: async () => {
                textureCube.value.setTexture2D(TextureCube.ImageNames[faceIndex], d);
                await updateImage(faceIndex);
                dispatchValueChange(faceIndex);
            },
        });
    });
    
    const menuAdapter = new MenuAdapter();
    menuAdapter.popup(menus);
}

// 触发值变化事件
function dispatchValueChange(faceIndex: number) {
    const face = faces[faceIndex];
    if (props.attributeViewInfo) {
        const event = new ObjectViewEvent();
        event.type = ObjectViewEvent.VALUE_CHANGE;
        (event as any).space = r_owner;
        (event as any).attributeName = face.property;
        (event as any).attributeValue = textureCube.value;
    }
    objectEmitter.emit(textureCube.value, 'propertyValueChanged');
}

// 计算每个面的尺寸和位置
const w4 = computed(() => Math.round(containerWidth.value / 4));

// 监听容器宽度变化
const containerRef = ref<HTMLElement | null>(null);

onMounted(() => {
    initImages();
    
    // 监听容器大小变化
    if (containerRef.value) {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                containerWidth.value = entry.contentRect.width;
            }
        });
        resizeObserver.observe(containerRef.value);
        
        // 清理
        return () => {
            resizeObserver.disconnect();
        };
    }
});

// 监听 textureCube 变化
watch(() => textureCube.value, () => {
    initImages();
}, { deep: true });
</script>

<template>
    <div class="oav-cubemap">
        <div class="oav-row">
            <label class="oav-label" :title="props.name">{{ label }}</label>
        </div>
        <div ref="containerRef" class="oav-cubemap-container" :style="{ width: '100%' }">
            <div class="oav-cubemap-grid" :style="{ width: `${w4 * 4}px`, height: `${w4 * 3}px` }">
                <!-- PX (正面) -->
                <div
                    class="oav-cubemap-face"
                    :style="{
                        left: `${w4 * 2}px`,
                        top: `${w4}px`,
                        width: `${w4}px`,
                        height: `${w4}px`,
                    }"
                >
                    <img
                        v-if="imageSources.px"
                        :src="imageSources.px"
                        :alt="faces[0].label"
                        class="oav-cubemap-image"
                    />
                    <div v-else class="oav-cubemap-placeholder">{{ faces[0].label }}</div>
                    <el-button
                        v-if="props.editable"
                        size="small"
                        text
                        class="oav-cubemap-btn"
                        @click="onImageClick(0)"
                    >
                        选择
                    </el-button>
                </div>
                
                <!-- PY (上) -->
                <div
                    class="oav-cubemap-face"
                    :style="{
                        left: `${w4}px`,
                        top: '0px',
                        width: `${w4}px`,
                        height: `${w4}px`,
                    }"
                >
                    <img
                        v-if="imageSources.py"
                        :src="imageSources.py"
                        :alt="faces[1].label"
                        class="oav-cubemap-image"
                    />
                    <div v-else class="oav-cubemap-placeholder">{{ faces[1].label }}</div>
                    <el-button
                        v-if="props.editable"
                        size="small"
                        text
                        class="oav-cubemap-btn"
                        @click="onImageClick(1)"
                    >
                        选择
                    </el-button>
                </div>
                
                <!-- PZ (右) -->
                <div
                    class="oav-cubemap-face"
                    :style="{
                        left: `${w4}px`,
                        top: `${w4}px`,
                        width: `${w4}px`,
                        height: `${w4}px`,
                    }"
                >
                    <img
                        v-if="imageSources.pz"
                        :src="imageSources.pz"
                        :alt="faces[2].label"
                        class="oav-cubemap-image"
                    />
                    <div v-else class="oav-cubemap-placeholder">{{ faces[2].label }}</div>
                    <el-button
                        v-if="props.editable"
                        size="small"
                        text
                        class="oav-cubemap-btn"
                        @click="onImageClick(2)"
                    >
                        选择
                    </el-button>
                </div>
                
                <!-- NX (背面) -->
                <div
                    class="oav-cubemap-face"
                    :style="{
                        left: '0px',
                        top: `${w4}px`,
                        width: `${w4}px`,
                        height: `${w4}px`,
                    }"
                >
                    <img
                        v-if="imageSources.nx"
                        :src="imageSources.nx"
                        :alt="faces[3].label"
                        class="oav-cubemap-image"
                    />
                    <div v-else class="oav-cubemap-placeholder">{{ faces[3].label }}</div>
                    <el-button
                        v-if="props.editable"
                        size="small"
                        text
                        class="oav-cubemap-btn"
                        @click="onImageClick(3)"
                    >
                        选择
                    </el-button>
                </div>
                
                <!-- NY (下) -->
                <div
                    class="oav-cubemap-face"
                    :style="{
                        left: `${w4}px`,
                        top: `${w4 * 2}px`,
                        width: `${w4}px`,
                        height: `${w4}px`,
                    }"
                >
                    <img
                        v-if="imageSources.ny"
                        :src="imageSources.ny"
                        :alt="faces[4].label"
                        class="oav-cubemap-image"
                    />
                    <div v-else class="oav-cubemap-placeholder">{{ faces[4].label }}</div>
                    <el-button
                        v-if="props.editable"
                        size="small"
                        text
                        class="oav-cubemap-btn"
                        @click="onImageClick(4)"
                    >
                        选择
                    </el-button>
                </div>
                
                <!-- NZ (左) -->
                <div
                    class="oav-cubemap-face"
                    :style="{
                        left: `${w4 * 3}px`,
                        top: `${w4}px`,
                        width: `${w4}px`,
                        height: `${w4}px`,
                    }"
                >
                    <img
                        v-if="imageSources.nz"
                        :src="imageSources.nz"
                        :alt="faces[5].label"
                        class="oav-cubemap-image"
                    />
                    <div v-else class="oav-cubemap-placeholder">{{ faces[5].label }}</div>
                    <el-button
                        v-if="props.editable"
                        size="small"
                        text
                        class="oav-cubemap-btn"
                        @click="onImageClick(5)"
                    >
                        选择
                    </el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.oav-cubemap {
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

.oav-cubemap-container {
    padding: 8px;
}

.oav-cubemap-grid {
    position: relative;
    margin: 0 auto;
}

.oav-cubemap-face {
    position: absolute;
    border: 1px solid var(--sideBar-border, #3d3d3d);
    background-color: var(--input-background, #1d1d1d);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.oav-cubemap-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.oav-cubemap-placeholder {
    font-size: 10px;
    color: var(--editor-foreground, #666);
    text-align: center;
}

.oav-cubemap-btn {
    position: absolute;
    bottom: 2px;
    right: 2px;
    opacity: 0;
    transition: opacity 0.2s;
}

.oav-cubemap-face:hover .oav-cubemap-btn {
    opacity: 1;
}
</style>
