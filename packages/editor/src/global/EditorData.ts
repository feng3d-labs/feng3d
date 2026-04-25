import { Scene, ArrayUtils, globalEmitter, shortcut, GameObject, Box3, TextAsset } from 'feng3d';
import { AssetNode } from '../ui/assets/AssetNode';
import { useEditorStore, MRSToolType } from '../vue-app/stores/editorStore';

/**
 * 游戏对象控制器类型
 * @deprecated 请使用从 editorStore 导入的 MRSToolType
 */
export { MRSToolType };

/**
 * 编辑器数据
 * @deprecated 请直接使用 useEditorStore() 替代
 * 此类作为过渡层，内部使用 Pinia store，后续会完全移除
 */
export class EditorData
{
    // 延迟初始化，确保 Pinia 已激活
    // 使用 getter 而不是直接赋值，避免在模块加载时就创建实例
    static get editorData(): EditorData {
        if (!EditorData._editorData) {
            EditorData._editorData = new EditorData();
        }
        return EditorData._editorData;
    }
    
    private static _editorData: EditorData | null = null;

    private get store(): any {
        try {
            return useEditorStore() as any;
        } catch (error) {
            // 如果 Pinia 还未激活，返回一个临时的空对象
            // 这应该不会发生，因为我们在 vite-entry.ts 中提前初始化了 Pinia
            console.warn('Pinia store not available yet, using fallback', error);
            return {
                gameScene: null,
                selectedObjects: [],
                toolType: 0,
                isBaryCenter: true,
                isWoldCoordinate: false,
                copyObjects: [],
                openScript: null,
                undoList: [],
                selectedGameObjects: [],
                selectedAssetNodes: [],
                transformGameObject: null,
                transformBox: null,
                setGameScene: () => {},
                setSelectedObjects: () => {},
                clearSelectedObjects: () => {},
                selectObject: () => {},
                selectMultiObject: () => {},
                setToolType: () => {},
                setIsBaryCenter: () => {},
                setIsWoldCoordinate: () => {},
                getEditorAssetPath: (url: string) => url,
            };
        }
    }

    /**
     * 游戏运行时的场景
     */
    get gameScene(): Scene | null {
        return this.store.gameScene as Scene | null;
    }
    set gameScene(v: Scene | null) {
        this.store.setGameScene(v);
    }

    /**
     * 选中对象，游戏对象与资源文件列表
     * 选中对象时尽量使用 selectObject 方法设置选中对象
     */
    get selectedObjects(): Array<GameObject | AssetNode> {
        return this.store.selectedObjects as Array<GameObject | AssetNode>;
    }

    set selectedObjects(v: Array<GameObject | AssetNode>) {
        this.store.setSelectedObjects(v as any);
    }

    /**
     * 被复制的对象
     */
    get copyObjects(): Array<any> {
        return this.store.copyObjects as Array<any>;
    }
    set copyObjects(v: Array<any>) {
        this.store.copyObjects = v as any;
    }

    clearSelectedObjects()
    {
        this.store.clearSelectedObjects();
    }

    /**
     * 选择对象
     * 该方法会处理 按ctrl键附加选中对象操作
     * @param object 选中的对象
     */
    selectObject(object: any)
    {
        this.store.selectObject(object);
    }

    /**
     * 选择对象
     * 该方法会处理 按ctrl键附加选中对象操作
     * @param objs 选中的对象
     */
    selectMultiObject(objs: (GameObject | AssetNode)[], isAdd?: boolean)
    {
        this.store.selectMultiObject(objs, isAdd);
    }

    /**
     * 使用的控制工具类型
     */
    get toolType(): MRSToolType {
        return this.store.toolType as MRSToolType;
    }
    set toolType(v: MRSToolType) {
        this.store.setToolType(v);
    }

    /**
     * 选中游戏对象列表
     */
    get selectedGameObjects(): GameObject[] {
        return this.store.selectedGameObjects as GameObject[];
    }

    /**
     * 坐标原点是否在质心
     */
    get isBaryCenter(): boolean {
        return this.store.isBaryCenter as boolean;
    }
    set isBaryCenter(v: boolean) {
        this.store.setIsBaryCenter(v);
    }

    /**
     * 是否使用世界坐标
     */
    get isWoldCoordinate(): boolean {
        return this.store.isWoldCoordinate as boolean;
    }
    set isWoldCoordinate(v: boolean) {
        this.store.setIsWoldCoordinate(v);
    }

    /**
     * 变换对象
     */
    get transformGameObject(): GameObject | null {
        return this.store.transformGameObject as GameObject | null;
    }

    get transformBox(): Box3 | null {
        return this.store.transformBox as Box3 | null;
    }

    /**
     * 选中资源节点列表
     */
    get selectedAssetNodes(): AssetNode[] {
        return this.store.selectedAssetNodes as AssetNode[];
    }

    /**
     * 编辑器打开的脚本
     */
    get openScript(): TextAsset | null {
        return this.store.openScript as TextAsset | null;
    }
    set openScript(v: TextAsset | null) {
        this.store.openScript = v as any;
    }

    /**
     * 历史记录undo列表
     */
    get undoList(): (() => void)[] {
        return this.store.undoList as (() => void)[];
    }
    set undoList(v: (() => void)[]) {
        this.store.undoList = v as any;
    }

    /**
     * 获取编辑器资源绝对路径
     * @param url 编辑器资源相对路径
     */
    getEditorAssetPath(url: string)
    {
        return this.store.getEditorAssetPath(url);
    }
}
