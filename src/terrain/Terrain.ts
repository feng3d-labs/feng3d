import { MeshRenderer } from '../core/core/MeshRenderer';
import { Node3D } from '../core/core/Node3D';
import { Geometry } from '../core/geometry/Geometry';
import { Material } from '../core/materials/Material';
import { createNodeMenu } from '../core/menu/CreateNodeMenu';
import { Component, RegisterComponent } from '../ecs/Component';
import { Serializable } from '../serialization/Serializable';
import { TerrainData } from './TerrainData';

declare global
{
    export interface MixinsComponentMap
    {
        Terrain: Terrain
    }

    export interface MixinsPrimitiveNode3D
    {
        Terrain: Node3D;
    }
}

/**
 * The Terrain component renders the terrain.
 */
// @ov({ component: "OVTerrain" })
@RegisterComponent({ name: 'Terrain', dependencies: [MeshRenderer] })
@Serializable('Terrain')
export class Terrain extends Component
{
    declare __class__: 'Terrain';

    /**
     * 地形资源
     */
    assign: TerrainData;

    private meshRenderer: MeshRenderer;

    constructor()
    {
        super();
    }

    init(): void
    {
        this.meshRenderer = this.getComponent(MeshRenderer);
        this.meshRenderer.material = Material.getDefault('Terrain-Material');
        this.meshRenderer.geometry = Geometry.getDefault('Terrain-Geometry');
    }

    dispose(): void
    {
        this.meshRenderer = null;
        super.dispose();
    }
}

Node3D.registerPrimitive('Terrain', (g) =>
{
    g.addComponent(Terrain);
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
