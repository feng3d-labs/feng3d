import { serialization, globalEmitter, logic } from 'feng3d';
import { editorRS } from './assets/EditorRS';
import { editorcache } from './caches/Editorcache';
import { EditorData } from './global/EditorData';
import { editorui } from './global/editorui';
import { modules } from './Modules';
import { Editorshortcut } from './shortcut/Editorshortcut';
import { editorAsset } from './ui/assets/EditorAsset';

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
        const scene = await editorAsset.readScene('default.scene.json');

        if (scene)
        {
            EditorData.editorData.gameScene = scene;
        }
        else
        {
            // TODO(P1 API 迁移)：`View` 现为纯 interface（无 `createNewScene()` 静态方法），
            // 新范式用纯数据字面量声明场景，待场景创建 API 重建后恢复。
            // EditorData.editorData.gameScene = View.createNewScene();
            EditorData.editorData.gameScene = null;
        }

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
