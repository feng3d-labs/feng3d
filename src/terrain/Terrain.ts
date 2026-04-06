import { RegisterComponent, Renderable, Geometry, Material, GameObject, createNodeMenu } from '@feng3d/core';
import { decoratorRegisterClass } from '@feng3d/polyfill';
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
