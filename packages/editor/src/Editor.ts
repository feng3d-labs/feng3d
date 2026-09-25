import { serialization, globalEmitter, logic } from 'feng3d';
import { editorRS } from './assets/EditorRS';
import { editorcache } from './caches/Editorcache';
import { EditorData } from './global/EditorData';
import { editorui } from './global/editorui';
import { modules } from './Modules';
import { Editorshortcut } from './shortcut/Editorshortcut';
import { editorAsset } from './ui/assets/EditorAsset';
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
    constructor()
    {
        // giteeOauth.oauth();
        // 关闭右键默认菜单
        document.body.oncontextmenu = function () { return false; };

        this.onAddedToStage();
    }

    private async onAddedToStage()
    {
        const { createMessageAdapter } = await import('./vue-app/components/MessageAdapter');
        modules.message = createMessageAdapter() as any;

        await this.initLayers();
        await editorRS.initproject();
        await this.init();

        console.log(`初始化完成。`);
    }

    private async initLayers()
    {
        editorui.tooltipLayer = {} as any;
        editorui.popupLayer = {} as any;
        editorui.messageLayer = {} as any;
        editorcache.projectname = editorcache.projectname || 'newproject';
    }

    private async init()
    {
        document.head.getElementsByTagName('title')[0].innerText = `feng3d-editor -- ${editorcache.projectname}`;

        editorcache.setLastProject(editorcache.projectname);

        await editorAsset.initproject();
        // 通知 ProjectView 资源树已初始化
        globalEmitter.emit('projectview.invalidateAssettree' as any);
        
        await editorAsset.runProjectScript();

        // 优先读取项目资源里的场景文件；读取/反序列化失败时回退到纯数据字面量默认场景，
        // 保证 `gameScene` 一定非空（层级面板不再显示 `No Data`，场景视图有对象可编辑）。
        //
        // 失败原因（TODO(P1) 序列化层议题，属主仓范围）：`readScene` 走
        // `editorRS.deserializeWithAssets` → `classUtils.getInstanceByName`（内部 `new Cls()`），
        // 而主仓数据类型已迁移为纯数据接口、运行时无构造器，且资源文件仍是旧格式
        // （`GameObject` / `Transform` 等类型已删除），因此旧资源必然加载失败。
        // 详见 `utils/createDefaultScene.ts` 的文件注释。
        const scene = await editorAsset.readScene('default.scene.json');
        EditorData.editorData.gameScene = scene ?? createDefaultSceneComponent();

        this.initMainView();
         
        new Editorshortcut();

        window.addEventListener('beforeunload', () =>
        {
            // `Scene` 是组件（纯数据接口），没有 `object3D` 字段；
            // 其宿主对象经 logic(scene).entity 取得。
            const scene = EditorData.editorData.gameScene;
            const sceneObject3D = scene ? logic(scene).entity : null;
            if (!sceneObject3D) return;

            const obj = serialization.serialize(sceneObject3D);
            editorRS.fs.writeObject('default.scene.json', obj);
        });
    }

    private initMainView()
    {
        editorui.mainview = {
            width: window.innerWidth,
            height: window.innerHeight,
        } as any;
    }
}
