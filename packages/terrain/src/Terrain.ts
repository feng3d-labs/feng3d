import { Renderable, Object3D, RunEnvironment, getDefaultMaterial, getDefaultGeometry } from 'feng3d';
import { TerrainData } from './TerrainData';

declare module 'feng3d'
{
    export interface ComponentMap
    {
        Terrain: Terrain;
    }
}

/**
 * 地形组件（纯数据）。
 *
 * 实现 Renderable 接口，渲染逻辑由 renderableLogic 提供。
 */
export class Terrain implements Renderable
{
    readonly __type__: 'Terrain' = 'Terrain';
    enabled = true;
    runEnvironment = RunEnvironment.all;

    /**
     * 地形资源
     */
    assign: TerrainData;

    geometry = getDefaultGeometry('Terrain-Geometry');

    material = getDefaultMaterial('Terrain-Material');

    castShadows = true;
    receiveShadows = true;
}
