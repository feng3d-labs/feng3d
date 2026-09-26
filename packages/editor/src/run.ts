 
 

// 从 CDN 导入 feng3d 和插件
import * as feng3d from 'feng3d';
import '@feng3d-plugins/cannon';
import '@feng3d-plugins/cannon-plugin';

// TODO(P1 API 迁移)：以下三行与上方重复导入同名绑定 `feng3d`，
// 在 ESM 下会直接抛 `Identifier 'feng3d' has already been declared`（SyntaxError），故删除重复声明。
// import * as feng3d from 'feng3d';
// import '@feng3d-plugins/cannon';
// import '@feng3d-plugins/cannon-plugin';

const fstype = GetQueryString('fstype');

(async () =>
{
    if (fstype === 'indexedDB')
    {
        feng3d.indexedDBFS.projectname = decodeURI(GetQueryString('project'));
        feng3d.FS.fs = feng3d.indexedDBFS as any;
        feng3d.ReadRS.rs = new feng3d.ReadRS(feng3d.indexedDBFS as any);
    }
    // 初始化资源系统
    await feng3d.ReadRS.rs.init();
    loadProjectJs(initProject);
})();

async function loadProjectJs(callback)
{
    if (feng3d.FS.fs.type === feng3d.FSType.http)
    {
        const path = feng3d.FS.fs.getAbsolutePath('project.js');
        const script = document.createElement('script');
        script.onload = () => { callback(); };
        script.src = path;
        document.head.appendChild(script);
    }
    else
    {
        // 读取项目脚本
        const content = await feng3d.FS.fs.readString('project.js');
        //
        const windowEval = eval.bind(window);
        // 运行project.js
        windowEval(content);
        callback();
    }
}

async function initProject()
{
    // TODO(P1 API 迁移)：`feng3d.View` 现为纯数据 interface（运行时无值），`new View()` 会抛
    // `TypeError: View is not a constructor`；且 `scene.getComponent(Scene)` / `camera.transform` 均为旧范式。
    // 新范式用纯数据字面量声明视图与场景，待 View / 场景创建 API 迁移后恢复整个初始化流程。
    /*
    const view = new feng3d.View();

    // 加载并初始化场景
    const obj = await feng3d.FS.fs.readObject('default.scene.json');

    const scene = await feng3d.ReadRS.rs.deserializeWithAssets(obj) as any;
    if (scene && typeof scene.getComponent === 'function' && scene.getComponent(feng3d.Scene))
    {
        view.scene = scene.getComponent(feng3d.Scene);
    }

    const cameras = view.root.getComponentsInChildren(feng3d.Camera);
    if (cameras.length > 0)
    {
        view.camera = cameras[0];
    }
    else
    {
        const camera = view.camera;
        feng3d.reactive(camera.transform.position).z = -10;
        feng3d.logic(camera.transform).lookAt(new feng3d.Vector3());
    }
    */
}

function GetQueryString(name): string
{
    const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
    const r = window.location.search.substr(1).match(reg);
    if (r) return r[2];

    return null;
}
