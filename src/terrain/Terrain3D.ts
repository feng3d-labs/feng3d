import { Geometry } from '../core/3d/geometrys/Geometry';
import { Material } from '../core/core/Material';
import { Node3D } from '../core/3d/core/Node3D';
import { createNodeMenu } from '../core/core/CreateNodeMenu';
import { Component, RegisterComponent } from '../ecs/Component';
import { TerrainData } from './Terrain3DData';

declare module '../ecs/Component' { interface ComponentMap { Terrain: Terrain3D } }

declare module '../core/3d/core/Node3D' { interface PrimitiveNode3D { Terrain: Node3D; } }

/**
 * The Terrain component renders the terrain.
 */
// @ov({ component: "OVTerrain" })
@RegisterComponent({ name: 'Terrain', dependencies: ['Mesh3D'] })
export class Terrain3D extends Component
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
        const meshRenderer = this.getComponent('Mesh3D');
        meshRenderer.material = Material.getDefault('Terrain-Material');
        meshRenderer.geometry = Geometry.getDefault('Terrain-Geometry');
    }

    destroy(): void
    {
        const meshRenderer = this.getComponent('Mesh3D');
        meshRenderer.geometry = null;
        meshRenderer.material = null;

        super.destroy();
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
