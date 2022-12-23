import { RegisterComponent, Renderable, Geometry, Material, Object3D, createNodeMenu } from '@feng3d/core';
import { decoratorRegisterClass } from '@feng3d/serialization';
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
