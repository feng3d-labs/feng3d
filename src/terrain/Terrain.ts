import { RegisterComponent } from '../core/component/Component';
import { Object3D } from '../core/core/Object3D';
import { Renderable } from '../core/core/Renderable';
import { Geometry } from '../core/geometry/Geometry';
import { Material } from '../core/materials/Material';
import { createNodeMenu } from '../core/menu/CreateNodeMenu';
import { serializable } from '../serialization/ClassUtils';
import { TerrainData } from './TerrainData';
import { TerrainGeometry } from './TerrainGeometry';

declare global
{
    export interface MixinsComponentMap
    {
        Terrain: Terrain
    }

    export interface MixinsPrimitiveObject3D
    {
        Terrain: Object3D;
    }
}

declare global
{
    interface MixinsClassMap
    {
        Terrain: Terrain
    }
}

/**
 * The Terrain component renders the terrain.
 */
// @ov({ component: "OVTerrain" })
@RegisterComponent()
@serializable('Terrain')
export class Terrain extends Renderable
{
    __class__: 'Terrain';

    /**
     * 地形资源
     */
    assign: TerrainData;

    geometry: TerrainGeometry = Geometry.getDefault('Terrain-Geometry');

    constructor()
    {
        super();
        this.material = Material.getDefault('Terrain-Material');
    }
}

Object3D.registerPrimitive('Terrain', (g) =>
{
    g.addComponent(Terrain);
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Terrain',
        priority: -20000,
        click: () =>
            Object3D.createPrimitive('Terrain')
    }
);
