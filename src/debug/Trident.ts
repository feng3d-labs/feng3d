namespace feng3d
{
    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    export class Trident extends Component
    {
        constructor(gameObject: GameObject)
        {
            super(gameObject);
            this.transform.mouseEnabled = false;

            length = 100;
            this.buildTrident(Math.abs((length == 0) ? 10 : length));
        }

        private buildTrident(length: number)
        {
            var xLine = GameObject.create("xLine");
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(length, 0, 0), 0xff0000, 0xff0000));
            xLine.addComponent(MeshFilter).mesh = segmentGeometry;
            xLine.addComponent(MeshRenderer).material = new SegmentMaterial();
            this.transform.addChild(xLine.transform);
            //
            var yLine = GameObject.create("yLine");
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(0, length, 0), 0x00ff00, 0x00ff00));
            yLine.addComponent(MeshFilter).mesh = segmentGeometry;
            yLine.addComponent(MeshRenderer).material = new SegmentMaterial();
            this.transform.addChild(yLine.transform);
            //
            var zLine = GameObject.create("zLine");
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(0, 0, length), 0x0000ff, 0x0000ff));
            zLine.addComponent(MeshFilter).mesh = segmentGeometry;
            zLine.addComponent(MeshRenderer).material = new SegmentMaterial();
            this.transform.addChild(zLine.transform);
            //
            var xArrow = GameObject.create("xArrow");
            xArrow.transform.x = length;
            xArrow.transform.rz = -90;
            xArrow.addComponent(MeshFilter).mesh = new ConeGeometry(5, 18);;
            var material = xArrow.addComponent(MeshRenderer).material = new ColorMaterial();
            material.color = new Color(1, 0, 0);
            this.transform.addChild(xArrow.transform);
            //
            var yArrow = GameObject.create("yArrow");
            yArrow.transform.y = length;
            yArrow.addComponent(MeshFilter).mesh = new ConeGeometry(5, 18);
            var material = yArrow.addComponent(MeshRenderer).material = new ColorMaterial();
            material.color = new Color(0, 1, 0);
            this.transform.addChild(yArrow.transform);
            //
            var zArrow = GameObject.create("zArrow");
            zArrow.transform.z = length;
            zArrow.transform.rx = 90;
            zArrow.addComponent(MeshFilter).mesh = new ConeGeometry(5, 18);
            var material = zArrow.addComponent(MeshRenderer).material = new ColorMaterial();
            material.color = new Color(0, 0, 1);
            this.transform.addChild(zArrow.transform);
        }
    }
}