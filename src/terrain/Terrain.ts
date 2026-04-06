import { RegisterComponent } from '../core/component/Component';
import { GameObject } from '../core/core/GameObject';
import { Renderable } from '../core/core/Renderable';
import { Geometry } from '../core/geometry/Geometry';
import { Material } from '../core/materials/Material';
import { createNodeMenu } from '../core/menu/CreateNodeMenu';
import { decoratorRegisterClass } from '../polyfill/ClassUtils';
import { TerrainData } from './TerrainData';

declare global
{
    export interface MixinsComponentMap
    {
        Terrain: Terrain
    }

    export interface MixinsPrimitiveGameObject
    {
        Terrain: GameObject;
    }
}

/**
 * The Terrain component renders the terrain.
 */
// @ov({ component: "OVTerrain" })
@RegisterComponent()
@decoratorRegisterClass()
export class Terrain extends Renderable
{
    __class__: 'Terrain';

    /**
     * 地形资源
     */
    assign: TerrainData;

    geometry = Geometry.getDefault('Terrain-Geometry');

    constructor()
    {
        super();
        this.material = Material.getDefault('Terrain-Material');
    }
}

GameObject.registerPrimitive('Terrain', (g) =>
{
    g.addComponent(Terrain);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Terrain',
        priority: -20000,
        click: () =>
            GameObject.createPrimitive('Terrain')
    }
);
