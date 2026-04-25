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
    viewLayout: Object;

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
        const value = localStorage.getItem('feng3d-editor');
        if (!value) return;
        const obj = JSON.parse(value);
        for (const key in obj)
        {
            if (obj.hasOwnProperty(key))
            {
                this[key] = obj[key];
            }
        }
    }

    save()
    {
        localStorage.setItem('feng3d-editor', JSON.stringify(this, null, '\t').replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1'));
    }
}

export const editorcache = new EditorCache();

window.addEventListener('beforeunload', () =>
{
    if (EditorAsset.codeeditoWin) EditorAsset.codeeditoWin.close();
    closeRunWindow();
    editorcache.save();
});
