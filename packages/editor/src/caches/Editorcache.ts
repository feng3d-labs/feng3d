import { EditorAsset } from '../ui/assets/EditorAsset';
// TopView 已迁移到 Vue，但 runwin 仍需要管理
// 从 runWindowManager 导入
import { closeRunWindow } from '../vue-app/utils/runWindowManager';

export class EditorCache
{
    /**
     * 保存最后一次打开的项目路径
     */
    projectname: string;

    /**
     * 最近的项目列表
     */
    lastProjects: string[] = [];

    /**
     * 界面布局数据
     */
    viewLayout: object;

    /**
     * 设置最近打开的项目
     */
    setLastProject(projectname: string)
    {
        const index = this.lastProjects.indexOf(projectname);
        if (index !== -1)
        {
            this.lastProjects.splice(index, 1);
        }
        this.lastProjects.unshift(projectname);
    }

    constructor()
    {
        // 非浏览器环境（Node 里跑单元测试）没有 localStorage——守卫而不是让它抛，
        // 与 `themeStore` 里 `typeof window === 'undefined' || typeof localStorage === 'undefined'`
        // 的写法一致。模块顶层的 `new EditorCache()` 本身是 R2 的既有违反项（见 issue #170
        // 的范围说明），这里只修「import 就崩」这一半。
        if (typeof localStorage === 'undefined') return;

        const value = localStorage.getItem('feng3d-editor');
        if (!value) return;
        const obj = JSON.parse(value);
        for (const key in obj)
        {
            if (Object.prototype.hasOwnProperty.call(obj, key))
            {
                this[key] = obj[key];
            }
        }
    }

    save()
    {
        if (typeof localStorage === 'undefined') return;

        localStorage.setItem('feng3d-editor', JSON.stringify(this, null, '\t').replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1'));
    }
}

export const editorcache = new EditorCache();

// 卸载前保存缓存并关掉子窗口。
//
// `typeof window` 守卫不是防御性编程，而是**必要的**：本文件会被编辑器主干 import，
// 而 Node 环境（单元测试）里没有 window；不守卫的话 `import` 这个模块直接 ReferenceError。
// 注意**不能**改成在测试环境里定义 `window` 来绕过：仓库里多处用
// `typeof window === 'undefined'` 作为「非浏览器」判据（见 vitest.setup.ts 的说明），
// 定义了 window 会让那些守卫失效并走进浏览器专属分支。
if (typeof window !== 'undefined')
{
    window.addEventListener('beforeunload', () =>
    {
        if (EditorAsset.codeeditoWin) EditorAsset.codeeditoWin.close();
        closeRunWindow();
        editorcache.save();
    });
}
