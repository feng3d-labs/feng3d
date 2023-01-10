import { Node3D } from '../core/core/Node3D';
import { Geometry } from '../core/geometry/Geometry';
import { Material } from '../core/materials/Material';
import { createNodeMenu } from '../core/menu/CreateNodeMenu';
import { Component, RegisterComponent } from '../ecs/Component';
import { TerrainData } from './TerrainData';

declare module '../ecs/Component' { interface ComponentMap { Terrain: Terrain } }

declare module '../core/core/Node3D' { interface PrimitiveNode3D { Terrain: Node3D; } }

/**
 * The Terrain component renders the terrain.
 */
// @ov({ component: "OVTerrain" })
@RegisterComponent({ name: 'Terrain', dependencies: ['MeshRenderer'] })
export class Terrain extends Component
{
    declare __class__: 'Terrain';

    /**
     * 地形资源
     */
    assign: TerrainData;

    constructor()
    {
        super();
    }

    init(): void
    {
        const meshRenderer = this.getComponent('MeshRenderer');
        meshRenderer.material = Material.getDefault('Terrain-Material');
        meshRenderer.geometry = Geometry.getDefault('Terrain-Geometry');
    }

    dispose(): void
    {
        const meshRenderer = this.getComponent('MeshRenderer');
        meshRenderer.geometry = null;
        meshRenderer.material = null;

        super.dispose();
    }
}

Node3D.registerPrimitive('Terrain', (g) =>
{
    g.addComponent('Terrain');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Terrain',
        priority: -20000,
        click: () =>
            Node3D.createPrimitive('Terrain')
    }
);
