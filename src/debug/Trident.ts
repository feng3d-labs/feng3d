module feng3d
{
    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    export class Trident extends Component
    {
        @oav()
        lineLength = 100;

        @oav()
        arrowradius = 5;

        @oav()
        arrowHeight = 18;

        init(gameObject: GameObject)
        {
            super.init(gameObject);
            this.gameObject.mouseEnabled = false;

            this.buildTrident();
        }

        private buildTrident()
        {
            var xLine = GameObject.create("xLine");
            xLine.serializable = false;
            xLine.showinHierarchy = false;
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(this.lineLength, 0, 0), new Color(1, 0, 0), new Color(1, 0, 0)));
            var meshRenderer = xLine.addComponent(MeshRenderer);
            meshRenderer.geometry = segmentGeometry;
            meshRenderer.material = new SegmentMaterial();
            this.gameObject.addChild(xLine);
            //
            var yLine = GameObject.create("yLine");
            yLine.serializable = false;
            yLine.showinHierarchy = false;
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(0, this.lineLength, 0), new Color(0, 1, 0), new Color(0, 1, 0)));
            meshRenderer = yLine.addComponent(MeshRenderer);
            meshRenderer.material = new SegmentMaterial();
            meshRenderer.geometry = segmentGeometry;
            this.gameObject.addChild(yLine);
            //
            var zLine = GameObject.create("zLine");
            zLine.serializable = false;
            zLine.showinHierarchy = false;
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.addSegment(new Segment(new Vector3D(), new Vector3D(0, 0, this.lineLength), new Color(0, 0, 1), new Color(0, 0, 1)));
            meshRenderer = zLine.addComponent(MeshRenderer);
            meshRenderer.material = new SegmentMaterial();
            meshRenderer.geometry = segmentGeometry;
            this.gameObject.addChild(zLine);
            //
            var xArrow = GameObject.create("xArrow");
            xArrow.serializable = false;
            xArrow.showinHierarchy = false;
            xArrow.transform.x = this.lineLength;
            xArrow.transform.rz = -90;
            var meshRenderer = xArrow.addComponent(MeshRenderer);
            var material = meshRenderer.material = new ColorMaterial();
            meshRenderer.geometry = new ConeGeometry(this.arrowradius, this.arrowHeight);;
            material.color = new Color(1, 0, 0);
            this.gameObject.addChild(xArrow);
            //
            var yArrow = GameObject.create("yArrow");
            yArrow.serializable = false;
            yArrow.showinHierarchy = false;
            yArrow.transform.y = this.lineLength;
            meshRenderer = yArrow.addComponent(MeshRenderer);
            var material = meshRenderer.material = new ColorMaterial();
            meshRenderer.geometry = new ConeGeometry(this.arrowradius, this.arrowHeight);
            material.color = new Color(0, 1, 0);
            this.gameObject.addChild(yArrow);
            //
            var zArrow = GameObject.create("zArrow");
            zArrow.serializable = false;
            zArrow.showinHierarchy = false;
            zArrow.transform.z = this.lineLength;
            zArrow.transform.rx = 90;
            meshRenderer = zArrow.addComponent(MeshRenderer);
            meshRenderer.geometry = new ConeGeometry(this.arrowradius, this.arrowHeight);
            var material = meshRenderer.material = new ColorMaterial();
            material.color = new Color(0, 0, 1);
            this.gameObject.addChild(zArrow);
        }
    }
}