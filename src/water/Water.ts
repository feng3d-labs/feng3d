namespace feng3d
{
    /**
     * The Water component renders the terrain.
     */
    export class Water extends MeshRenderer
    {
        geometry = new PlaneGeometry({ width: 10, height: 10 });

        material = materialFactory.create("water");
    }
}