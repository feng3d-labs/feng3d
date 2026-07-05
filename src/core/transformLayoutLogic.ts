import { logic } from './logic';
import { Vector3 } from '@feng3d/math';
import { batchRun, effect, reactive } from '@feng3d/reactivity';
import { ComponentLogic, registerComponentLogic } from '../component/componentLogic';
import { ticker } from '../utils/Ticker';
import { TransformLayout } from './TransformLayout';
import { Object3D } from './Object3D';
import { containerLogic } from "./containerLogic";

/**
 * TransformLayout 逻辑处理输出。
 *
 * 通过 effect 监听 position/size/anchor/pivot/leftTop/rightBottom 变化，
 * 失效布局并在下一帧重新计算（_updateLayout），将结果写入 object3D.position。
 *
 * 变化时 emit sizeChanged / pivotChanged 事件。
 */
export interface TransformLayoutLogic extends ComponentLogic
{
    /** 触发布局重算 */
    invalidateLayout(): void;
}


/**
 * 获取 TransformLayout 的 logic。
 */
export function transformLayoutLogic(layout: TransformLayout): TransformLayoutLogic

{
    return logic<TransformLayoutLogic>(layout);
}

function createTransformLayoutLogic(layout: TransformLayout): TransformLayoutLogic
{
    let _layoutInvalid = true;
    let _inited = false;

    function updateLayout(): void
    {
        if (!_layoutInvalid) return;

        const parent = logic.object3D && containerLogic(logic.object3D).parent as Object3D | null;
        if (!parent) return;
        const transformLayout = parent.components.find(c => c.__type__ === 'TransformLayout') as TransformLayout;
        if (!transformLayout) return;

        // 中心点基于anchorMin的坐标
        const position = layout.position;
        // 尺寸
        const size = layout.size;
        const leftTop = layout.leftTop;
        const rightBottom = layout.rightBottom;

        // 最小锚点
        const anchorMin = layout.anchorMin.clone();
        // 最大锚点
        const anchorMax = layout.anchorMax.clone();
        const pivot = layout.pivot.clone();

        // 父对象显示区域宽高
        const parentSize = transformLayout.size;
        const parentPivot = transformLayout.pivot;
        // 锚点在父Transform2D中锚定的 leftRightTopBottom 位置。
        const anchorLeftTop = new Vector3(
            anchorMin.x * parentSize.x - parentPivot.x * parentSize.x,
            anchorMin.y * parentSize.y - parentPivot.y * parentSize.y,
            anchorMin.z * parentSize.z - parentPivot.z * parentSize.z,
        );
        const anchorRightBottom = new Vector3(
            anchorMax.x * parentSize.x - parentPivot.x * parentSize.x,
            anchorMax.y * parentSize.y - parentPivot.y * parentSize.y,
            anchorMax.z * parentSize.z - parentPivot.z * parentSize.z,
        );

        if (anchorMin.x === anchorMax.x)
        {
            leftTop.x = (-pivot.x * size.x + position.x) - anchorLeftTop.x;
            rightBottom.x = anchorRightBottom.x - (size.x - pivot.x * size.x + position.x);
        }
        else
        {
            size.x = (anchorRightBottom.x - rightBottom.x) - (anchorLeftTop.x + leftTop.x);
            position.x = leftTop.x + pivot.x * size.x;
        }

        if (anchorMin.y === anchorMax.y)
        {
            leftTop.y = (-pivot.y * size.y + position.y) - anchorLeftTop.y;
            rightBottom.y = anchorRightBottom.y - (size.y - pivot.y * size.y + position.y);
        }
        else
        {
            size.y = (anchorRightBottom.y - rightBottom.y) - (anchorLeftTop.y + leftTop.y);
            position.y = leftTop.y + pivot.y * size.y;
        }

        if (anchorMin.z === anchorMax.z)
        {
            leftTop.z = (-pivot.z * size.z + position.z) - anchorLeftTop.z;
            rightBottom.z = anchorRightBottom.z - (size.z - pivot.z * size.z + position.z);
        }
        else
        {
            size.z = (anchorRightBottom.z - rightBottom.z) - (anchorLeftTop.z + leftTop.z);
            position.z = leftTop.z + pivot.z * size.z;
        }

        //
        {
            const _r_pos = reactive(logic.object3D.position);
            batchRun(() =>
            {
                _r_pos.x = anchorLeftTop.x + position.x;
                _r_pos.y = anchorLeftTop.y + position.y;
                _r_pos.z = anchorLeftTop.z + position.z;
            });
        }
        //
        _layoutInvalid = false;
        ticker.offframe(updateLayout, logic);
    }

    function invalidateLayout(): void
    {
        _layoutInvalid = true;
        ticker.onframe(updateLayout, logic);
    }

    function invalidateSize(): void
    {
        invalidateLayout();
    }

    function invalidatePivot(): void
    {
        invalidateLayout();
    }

    const logic: TransformLayoutLogic = {
        object3D: null as any,
        invalidateLayout,
        init()
        {
            if (_inited) return;
            _inited = true;
            invalidateLayout();

            // effect 监听 position/anchor 变化
            effect(() =>
            {
                const r_layout = reactive(layout);
                r_layout.position.x; r_layout.position.y; r_layout.position.z;
                r_layout.anchorMin.x; r_layout.anchorMin.y; r_layout.anchorMin.z;
                r_layout.anchorMax.x; r_layout.anchorMax.y; r_layout.anchorMax.z;
                invalidateLayout();
            });

            // effect 监听 leftTop/rightBottom/size 变化
            effect(() =>
            {
                const r_layout = reactive(layout);
                r_layout.leftTop.x; r_layout.leftTop.y; r_layout.leftTop.z;
                r_layout.rightBottom.x; r_layout.rightBottom.y; r_layout.rightBottom.z;
                r_layout.size.x; r_layout.size.y; r_layout.size.z;
                invalidateSize();
            });

            // effect 监听 pivot 变化
            effect(() =>
            {
                const r_layout = reactive(layout);
                r_layout.pivot.x; r_layout.pivot.y; r_layout.pivot.z;
                invalidatePivot();
            });
        },
        beforeRender() { /* u_rect uniform 待通过 bindingResources 注入 */ },
        dispose()
        {
            ticker.offframe(updateLayout, logic);
                    },
    };

    return logic;
}

// 注册到 componentLogic 分发表
registerComponentLogic('TransformLayout', (component) =>
{
    return transformLayoutLogic(component as TransformLayout);
});
