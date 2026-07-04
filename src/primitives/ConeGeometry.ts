import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { Object3D } from '../core/Object3D';
import { MeshRenderer } from '../core/MeshRenderer';
import { createPrimitive, registerPrimitive } from '../core/object3DLogic';
import { Geometry } from '../geometry/Geometry';
import { createNodeMenu } from '../menu/CreateNodeMenu';
import { CylinderGeometry } from './CylinderGeometry';

declare global
{
    export interface MixinsGeometryTypes
    {
        ConeGeometry: ConeGeometry
    }
    export interface MixinsDefaultGeometry
    {
        Cone: ConeGeometry;
    }
    export interface MixinsPrimitiveObject3D
    {
        Cone: Object3D;
    }
}

/**
 * 圆锥体
 */
@decoratorRegisterClass()
export class ConeGeometry extends CylinderGeometry
{
    __class__: 'ConeGeometry' = 'ConeGeometry';

    name = 'Cone';

    /**
     * 底部半径 private
     */
    topRadius = 0;

    /**
     * 顶部是否封口 private
     */
    topClosed = false;

    /**
     * 侧面是否封口 private
     */
    surfaceClosed = true;
}

Geometry.setDefault('Cone', new ConeGeometry());

registerPrimitive('Cone', (g) =>
{
    const r = new MeshRenderer(); reactive(g).components.push(r); r.setObject3D(g); r.init(); r.geometry = Geometry.getDefault('Cone');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Cone',
        priority: -10000,
        click: () =>
            createPrimitive('Cone')
    }
);

