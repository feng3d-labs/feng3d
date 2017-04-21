module feng3d
{
    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    export class Trident extends GameObject
    {
        private _xLine: GameObject;
        private _yLine: GameObject;
        private _zLine: GameObject;

        private _xArrow: ConeObject3D;
        private _yArrow: ConeObject3D;
        private _zArrow: ConeObject3D;

        constructor(length = 100)
        {
            super();
            this.buildTrident(Math.abs((length == 0) ? 10 : length));
        }

        private buildTrident(length: number)
        {
            this._xLine = new GameObject();
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(length, 0, 0), 0xff0000, 0xff0000));
            this._xLine.getOrCreateComponentByClass(Model).geometry = segmentGeometry;
            this._xLine.getOrCreateComponentByClass(Model).material = new SegmentMaterial();
            this.addChild(this._xLine);
            //
            this._yLine = new GameObject();
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(0, length, 0), 0x00ff00, 0x00ff00));
            this._yLine.getOrCreateComponentByClass(Model).geometry = segmentGeometry;
            this._yLine.getOrCreateComponentByClass(Model).material = new SegmentMaterial();
            this.addChild(this._yLine);
            //
            this._zLine = new GameObject();
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(0, 0, length), 0x0000ff, 0x0000ff));
            this._zLine.getOrCreateComponentByClass(Model).geometry = segmentGeometry;
            this._zLine.getOrCreateComponentByClass(Model).material = new SegmentMaterial();
            this.addChild(this._zLine);
            //
            this._xArrow = new GameObject();
            this._xArrow.x = length;
            this._xArrow.rotationZ = -90;
            this._xArrow.getOrCreateComponentByClass(Model).geometry = new ConeGeometry(5, 18);;
            var material = this._xArrow.getOrCreateComponentByClass(Model).material = new ColorMaterial();
            material.color = new Color(1, 0, 0);
            this.addChild(this._xArrow);
            //
            this._yArrow = new GameObject();
            this._yArrow.y = length;
            this._yArrow.getOrCreateComponentByClass(Model).geometry = new ConeGeometry(5, 18);
            var material = this._yArrow.getOrCreateComponentByClass(Model).material = new ColorMaterial();
            material.color = new Color(0, 1, 0);
            this.addChild(this._yArrow);
            //
            this._zArrow = new GameObject();
            this._zArrow.z = length;
            this._zArrow.rotationX = 90;
            this._zArrow.getOrCreateComponentByClass(Model).geometry = new ConeGeometry(5, 18);
            var material = this._zArrow.getOrCreateComponentByClass(Model).material = new ColorMaterial();
            material.color = new Color(0, 0, 1);
            this.addChild(this._zArrow);
        }
    }
}