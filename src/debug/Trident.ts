namespace feng3d
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

        private _xArrow: GameObject;
        private _yArrow: GameObject;
        private _zArrow: GameObject;

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
            this._xLine.addComponent(MeshFilter).mesh = segmentGeometry;
            this._xLine.addComponent(MeshRenderer).material = new SegmentMaterial();
            this.transform.addChild(this._xLine.transform);
            //
            this._yLine = new GameObject();
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(0, length, 0), 0x00ff00, 0x00ff00));
            this._yLine.addComponent(MeshFilter).mesh = segmentGeometry;
            this._yLine.addComponent(MeshRenderer).material = new SegmentMaterial();
            this.transform.addChild(this._yLine.transform);
            //
            this._zLine = new GameObject();
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(0, 0, length), 0x0000ff, 0x0000ff));
            this._zLine.addComponent(MeshFilter).mesh = segmentGeometry;
            this._zLine.addComponent(MeshRenderer).material = new SegmentMaterial();
            this.transform.addChild(this._zLine.transform);
            //
            this._xArrow = new GameObject();
            this._xArrow.transform.x = length;
            this._xArrow.transform.rotationZ = -90;
            this._xArrow.addComponent(MeshFilter).mesh = new ConeGeometry(5, 18);;
            var material = this._xArrow.addComponent(MeshRenderer).material = new ColorMaterial();
            material.color = new Color(1, 0, 0);
            this.transform.addChild(this._xArrow.transform);
            //
            this._yArrow = new GameObject();
            this._yArrow.transform.y = length;
            this._yArrow.addComponent(MeshFilter).mesh = new ConeGeometry(5, 18);
            var material = this._yArrow.addComponent(MeshRenderer).material = new ColorMaterial();
            material.color = new Color(0, 1, 0);
            this.transform.addChild(this._yArrow.transform);
            //
            this._zArrow = new GameObject();
            this._zArrow.transform.z = length;
            this._zArrow.transform.rotationX = 90;
            this._zArrow.addComponent(MeshFilter).mesh = new ConeGeometry(5, 18);
            var material = this._zArrow.addComponent(MeshRenderer).material = new ColorMaterial();
            material.color = new Color(0, 0, 1);
            this.transform.addChild(this._zArrow.transform);
        }
    }
}