import { serialization, View, globalEmitter } from 'feng3d';
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
            EditorData.editorData.gameScene = View.createNewScene();
        }

        this.initMainView();
        // eslint-disable-next-line no-new
        new Editorshortcut();

        window.addEventListener('beforeunload', () =>
        {
            const obj = serialization.serialize(EditorData.editorData.gameScene.gameObject);
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
