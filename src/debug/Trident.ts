module feng3d
{

    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    export class Trident extends Object3D
    {

        public xLine: SegmentObject3D;
        public yLine: SegmentObject3D;
        public zLine: SegmentObject3D;

        public xArrow: ConeObject3D;
        public yArrow: ConeObject3D;
        public zArrow: ConeObject3D;

        constructor(length = 100)
        {
            super();
            this.buildTrident(Math.abs((length == 0) ? 10 : length));
        }

        private buildTrident(length: number)
        {

            this.xLine = new SegmentObject3D();
            this.xLine.segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(length, 0, 0), 0xff0000, 0xff0000));
            this.addChild(this.xLine);
            //
            this.yLine = new SegmentObject3D();
            this.yLine.segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(0, length, 0), 0xff0000, 0xff0000));
            this.addChild(this.yLine);
            //
            this.zLine = new SegmentObject3D();
            this.zLine.segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(0, 0, length), 0xff0000, 0xff0000));
            this.addChild(this.zLine);
            //
            this.xArrow = new ConeObject3D(5, 18);
            this.xArrow.transform.x = length;
            this.xArrow.transform.rz = -90;
            this.xArrow.colorMaterial.color = new Color(1, 0, 0);
            this.addChild(this.xArrow);
            //
            this.yArrow = new ConeObject3D(5, 18);
            this.yArrow.transform.y = length;
            this.yArrow.colorMaterial.color = new Color(0, 1, 0);
            this.addChild(this.yArrow);
            //
            this.zArrow = new ConeObject3D(5, 18);
            this.zArrow.transform.z = length;
            this.zArrow.transform.rx = 90;
            this.zArrow.colorMaterial.color = new Color(0, 0, 1);
            this.addChild(this.zArrow);
        }
    }
}