import { GameObject } from 'feng3d';
import { objectview } from 'feng3d';

/**
 * 检查器多对象处理
 */
export const inspectorMultiObject = {
    /**
     * 转换检查器对象
     */
    convertInspectorObject(selectedObjects: GameObject[]): any
    {
        if (selectedObjects.length === 0)
        {
            return null;
        }
        if (selectedObjects.length === 1)
        {
            return selectedObjects[0];
        }

        // 多对象选择时，创建一个组合对象视图
        const multiObject = {
            selectedObjects,
            getObjectView: () => objectview.getObjectView(selectedObjects, { editable: true }),
        };

        return multiObject;
    },
};
