import { decoratorRegisterClass } from '@feng3d/polyfill';
import { GameObject } from '../core/GameObject';
import { MeshRenderer } from '../core/MeshRenderer';
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
    export interface MixinsPrimitiveGameObject
    {
        Cone: GameObject;
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

GameObject.registerPrimitive('Cone', (g) =>
{
    g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Cone');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Cone',
        priority: -10000,
        click: () =>
            GameObject.createPrimitive('Cone')
    }
);

