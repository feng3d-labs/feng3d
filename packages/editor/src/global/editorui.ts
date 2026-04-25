// ProjectView 已迁移到 Vue，不再需要导入
// import { ProjectView } from '../ui/assets/ProjectView';
import { invalidateAssettree } from '../vue-app/views/ProjectViewAdapter';

export interface EditorUI
{
    stage: any;
    assetview: { invalidateAssettree: () => void };
    mainview: { width: number; height: number } | any;
    tooltipLayer: any;
    popupLayer: any;
    messageLayer: any;
}

export const editorui: EditorUI = <any>{
    get assetview() {
        return {
            invalidateAssettree,
        } as any;
    },
};
