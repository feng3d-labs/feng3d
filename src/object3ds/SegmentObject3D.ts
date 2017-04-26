module feng3d
{
    /**
     * 线条3D对象
     * @author feng 2017-02-06
     */
    export class SegmentObject3D extends GameObject
    {
        constructor(name = "Segment3D")
        {
            super(name);
            var model = new Model();
            model.material = new SegmentMaterial();
            model.geometry = new SegmentGeometry();
            this.addComponent(model);
        }
    }
}