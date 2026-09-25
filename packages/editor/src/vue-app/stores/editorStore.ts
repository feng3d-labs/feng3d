/**
 * 编辑器主状态 Store
 * 直接迁移自 EditorData，不保留重复代码
 */
import { defineStore } from 'pinia';
import { ref, computed, markRaw, shallowRef, toRaw } from 'vue';
import { ArrayUtils, globalEmitter, logic, shortcut, Box3, TextAsset } from 'feng3d';
import type { Scene, Object3D } from 'feng3d';
import { AssetNode } from '../../ui/assets/AssetNode';

/**
 * 游戏对象控制器类型
 */
export enum MRSToolType {
    /**
     * 移动
     */
    MOVE,
    /**
     * 旋转
     */
    ROTATION,
    /**
     * 缩放
     */
    SCALE,
}

/**
 * 编辑器主状态 Store
 */
export const useEditorStore = defineStore('editor', () => {
    // ========== 状态定义 ==========
    
    /**
     * 游戏运行时的场景
     * 使用 shallowRef 避免深度响应式，防止 Vue Proxy 干扰 feng3d 的事件系统
     */
    const gameScene = shallowRef<Scene | null>(null);

    /**
     * 选中对象，游戏对象与资源文件列表
     * 选中对象时尽量使用 selectObject 方法设置选中对象
     * 使用 shallowRef 避免深度响应式，防止 Vue Proxy 干扰 feng3d 的事件系统
     */
    const selectedObjects = shallowRef<Array<Object3D | AssetNode>>([]);

    /**
     * 使用的控制工具类型
     */
    const toolType = ref<MRSToolType>(MRSToolType.MOVE);

    /**
     * 坐标原点是否在质心
     */
    const isBaryCenter = ref<boolean>(true);

    /**
     * 是否使用世界坐标
     */
    const isWoldCoordinate = ref<boolean>(false);

    /**
     * 被复制的对象
     * 使用 shallowRef 避免深度响应式
     */
    const copyObjects = shallowRef<Array<any>>([]);

    /**
     * 编辑器打开的脚本
     * 使用 shallowRef 避免深度响应式
     */
    const openScript = shallowRef<TextAsset | null>(null);

    /**
     * 历史记录undo列表
     */
    const undoList = ref<Array<() => void>>([]);

    // ========== 计算属性 ==========

    /**
     * 选中游戏对象列表
     */
    const selectedObject3Ds = computed(() => {
        // `Object3D` 是纯数据接口（运行时无构造器），不能 instanceof；
        // 选中项是 Object3D | AssetNode 的联合类型，故反向判别排除 AssetNode 即可。
        return selectedObjects.value.filter((v): v is Object3D => !(v instanceof AssetNode));
    });

    /**
     * 选中资源节点列表
     */
    const selectedAssetNodes = computed(() => {
        return selectedObjects.value.filter((v): v is AssetNode => v instanceof AssetNode);
    });

    /**
     * 变换对象
     */
    const transformObject3D = computed(() => {
        const object3Ds = selectedObject3Ds.value;
        return object3Ds.length > 0 ? object3Ds[object3Ds.length - 1] : null;
    });

    /**
     * 变换包围盒
     */
    const transformBox = computed(() => {
        const object3Ds = selectedObject3Ds.value;
        if (object3Ds.length === 0) return null;

        let box: Box3 | null = null;
        object3Ds.forEach((cv) => {
            // boundingBox 是 Object3DLogic 的只读 getter（数据接口未暴露），须经 logic() 取
            const cvBox = logic(cv).boundingBox.worldBounds;
            if (isBaryCenter.value || !box) {
                box = cvBox.clone();
            } else {
                box.union(cvBox);
            }
        });

        return box;
    });

    // ========== Actions ==========

    /**
     * 设置游戏场景
     * 使用 markRaw 避免 Vue 响应式系统干扰 feng3d 的事件系统
     */
    function setGameScene(scene: Scene | null) {
        gameScene.value = scene ? markRaw(scene) : null;
    }

    /**
     * 设置选中对象
     */
    function setSelectedObjects(v: Array<Object3D | AssetNode>) {
        v = v.filter((v) => !!v);
        if (!v) v = [];
        
        // 检查是否真的改变了
        const current = selectedObjects.value as Array<Object3D | AssetNode>;
        if (v.length === current.length && 
            ArrayUtils.unique((v as any).concat(current)).length === v.length) {
            return;
        }

        // 使用 markRaw 标记 feng3d 对象，避免 Vue 响应式系统干扰
        const markedObjects = v.map(obj => markRaw(obj));
        selectedObjects.value = markedObjects as any;
        globalEmitter.emit('editor.selectedObjectsChanged');
    }

    /**
     * 清空选中对象
     */
    function clearSelectedObjects() {
        setSelectedObjects([]);
    }

    /**
     * 选择对象
     * 该方法会处理 按ctrl键附加选中对象操作
     * @param object 选中的对象
     */
    function selectObject(object: Object3D | AssetNode) {
        // 确保对象是原始对象（不是 Proxy），使用 toRaw 获取原始对象
        const rawObject = toRaw(object);
        
        const selecteds = [...(selectedObjects.value as Array<Object3D | AssetNode>)];
        const isAdd = shortcut.keyState.getKeyState('ctrl');
        
        if (!isAdd) selecteds.length = 0;
        
        const index = selecteds.indexOf(rawObject as any);
        if (index === -1) selecteds.push(rawObject as any);
        else selecteds.splice(index, 1);
        
        setSelectedObjects(selecteds as Array<Object3D | AssetNode>);
    }

    /**
     * 选择多个对象
     * 该方法会处理 按ctrl键附加选中对象操作
     * @param objs 选中的对象列表
     * @param isAdd 是否追加选择，如果未指定则根据ctrl键状态判断
     */
    function selectMultiObject(objs: Array<Object3D | AssetNode>, isAdd?: boolean) {
        // 确保对象是原始对象（不是 Proxy），使用 toRaw 获取原始对象
        const rawObjs = objs.map(obj => toRaw(obj));
        
        const selecteds = [...(selectedObjects.value as Array<Object3D | AssetNode>)];
        
        if (isAdd === undefined) {
            isAdd = shortcut.keyState.getKeyState('ctrl');
        }
        if (!isAdd) selecteds.length = 0;
        
        rawObjs.forEach((v) => {
            const index = selecteds.indexOf(v as any);
            if (index === -1) selecteds.push(v as any);
            else selecteds.splice(index, 1);
        });
        
        setSelectedObjects(selecteds as Array<Object3D | AssetNode>);
    }

    /**
     * 设置工具类型
     */
    function setToolType(v: MRSToolType) {
        if (toolType.value === v) return;
        toolType.value = v;
        globalEmitter.emit('editor.toolTypeChanged');
    }

    /**
     * 设置坐标原点是否在质心
     */
    function setIsBaryCenter(v: boolean) {
        if (isBaryCenter.value === v) return;
        isBaryCenter.value = v;
        globalEmitter.emit('editor.isBaryCenterChanged');
    }

    /**
     * 设置是否使用世界坐标
     */
    function setIsWoldCoordinate(v: boolean) {
        if (isWoldCoordinate.value === v) return;
        isWoldCoordinate.value = v;
        globalEmitter.emit('editor.isWoldCoordinateChanged');
    }

    /**
     * 获取编辑器资源路径
     * 使用相对路径，与 index.html 处于同一层级
     * @param url 编辑器资源相对路径
     */
    function getEditorAssetPath(url: string): string {
        return `./resource/${url}`;
    }

    return {
        // 状态
        gameScene,
        selectedObjects,
        toolType,
        isBaryCenter,
        isWoldCoordinate,
        copyObjects,
        openScript,
        undoList,
        
        // 计算属性
        selectedObject3Ds,
        selectedAssetNodes,
        transformObject3D,
        transformBox,
        
        // Actions
        setGameScene,
        setSelectedObjects,
        clearSelectedObjects,
        selectObject,
        selectMultiObject,
        setToolType,
        setIsBaryCenter,
        setIsWoldCoordinate,
        getEditorAssetPath,
    };
});

