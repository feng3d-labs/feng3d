module feng3d
{
    /**
     * 线条3D对象
     * @author feng 2017-02-06
     */
    export class SegmentObject3D extends Object3D
    {
        constructor(name = "Segment3D")
        {
            super(name);
            this.getOrCreateComponentByClass(MeshRenderer).material = new SegmentMaterial();
            this.addComponent(new SegmentGeometry());
        }
    }
}