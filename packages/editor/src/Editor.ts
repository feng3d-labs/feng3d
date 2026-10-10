import { serialization, globalEmitter, logic } from 'feng3d';
import type { EditorRS } from './assets/EditorRS';
import type { EditorCache } from './caches/Editorcache';
import { useEditorStore } from './vue-app/stores/editorStore';
import { modules } from './Modules';
import { Editorshortcut } from './shortcut/Editorshortcut';
import type { EditorAsset } from './ui/assets/EditorAsset';
import { startEditorBridge } from './bridge/EditorBridge';
import { createDefaultSceneComponent } from './utils/createDefaultScene';

/**
 * editor的版本号
 * 由构建脚本从 package.json 自动注入
 */
export const version = __VERSION__ || '0.6.0';

/**
 * 编辑器构建信息
 */
export const buildInfo = {
    version,
    buildTime: __BUILD_TIME__ || new Date().toISOString(),
    buildDate: __BUILD_DATE__ || new Date().toLocaleDateString('zh-CN'),
};

console.log(`%c========================================`, 'color: #6366f1; font-weight: bold');
console.log(`%c feng3d-editor`, 'color: #6366f1; font-weight: bold; font-size: 14px');
console.log(`%c 版本: ${buildInfo.version}`, 'color: #10b981; font-weight: bold');
console.log(`%c 构建时间: ${buildInfo.buildDate} ${new Date(buildInfo.buildTime).toLocaleTimeString('zh-CN', { hour12: false })}`, 'color: #8b5cf6');
console.log(`%c========================================`, 'color: #6366f1; font-weight: bold');

/**
 * 编辑器
 */
export class Editor
{
    /**
     * 资源系统（**构造注入**，#278 阶段 4b）。
     *
     * 以前这里直接 import 模块级单例——那让"谁在用资源系统"变成隐式的
     * （`MIGRATE_SINGLETONS.md` §3 第 4 步要处理的正是不透明）。现在由**装配点**
     * （应用入口 `App.vue`）传进来，`Editor` 只认这个字段。
     */
    private rs: EditorRS;

    /**
     * 资源管理器（**构造注入**，#278 路线 B 第三批）。
     *
     * 与 `rs` 同一套做法：由装配点（`App.vue`——它是根组件、能 `inject`）传进来。
     * 注意 `EditorAsset` 是**有状态单例**（资产树在它身上），所以传的必须是
     * **入口 provide 的那个实例**，不能另造一个。
     */
    private assetManager: EditorAsset;

    /**
     * 编辑器缓存（**构造注入**，#278 路线 B 第七批）。
     *
     * 与 `rs` / `assetManager` 同一套：由装配点（`vue-app/App.vue`）传进来。
     * 原先这里直接调 `getEditorCache()`，于是"谁在用偏好"是隐式的。
     */
    private cache: EditorCache;

    constructor(rs: EditorRS, assetManager: EditorAsset, cache: EditorCache)
    {
        this.rs = rs;
        this.assetManager = assetManager;
        this.cache = cache;

        // 关闭右键默认菜单
        document.body.oncontextmenu = function () { return false; };

        this.onAddedToStage();
    }

    private async onAddedToStage()
    {
        const { createMessageAdapter } = await import('./vue-app/components/MessageAdapter');
        modules.message = createMessageAdapter() as any;

        await this.initLayers();
        await this.rs.initproject(this.cache);
        await this.init();

        console.log(`初始化完成。`);
    }

    private async initLayers()
    {
        // 原先这里还给 `editorui` 的三个层对象赋值（tooltip / popup / message）——
        // 那些字段**从头到尾没人读过**，随 `editorui` 空壳一起删掉（#272 P5 第 1 步）
        this.cache.projectname = this.cache.projectname || 'newproject';
    }

    private async init()
    {
        document.head.getElementsByTagName('title')[0].innerText = `feng3d-editor -- ${this.cache.projectname}`;

        this.cache.setLastProject(this.cache.projectname);

        await this.assetManager.initproject();
        // 通知 ProjectView 资源树已初始化
        globalEmitter.emit('projectview.invalidateAssettree' as any);
        

        // 优先读取项目资源里的场景文件（`resource/template/default.scene.json` 已由
        // `scripts/migrate-scene-json.mjs` 迁移为**纯数据格式**，`readScene` 直接反序列化即可，
        // 见 docs/migrations/SERIALIZATION_MIGRATION.md 的 S2/S3）；读取或反序列化失败时回退到纯数据
        // 字面量默认场景，保证 `gameScene` 一定非空（层级面板不再显示 `No Data`）。
        const scene = await this.assetManager.readScene('scenes/default.scene.json');
        useEditorStore().gameScene = scene ?? createDefaultSceneComponent();

        // 启动只读 AI 桥接（P1）：让 DSH / CLI 能以语义化方式查询场景。
        // 仅读取数据、不提供任何写入方法，细节见 src/bridge/EditorBridge.ts。
        startEditorBridge(this.rs, this.assetManager);
         
        new Editorshortcut();

        window.addEventListener('beforeunload', () =>
        {
            // `Scene` 是组件（纯数据接口），没有 `object3D` 字段；
            // 其宿主对象经 logic(scene).entity 取得。
            const scene = useEditorStore().gameScene;
            const sceneObject3D = scene ? logic(scene).entity : null;
            if (!sceneObject3D) return;

            const obj = serialization.serialize(sceneObject3D);
            this.rs.fs.writeObject('scenes/default.scene.json', obj);
        });
    }
}
