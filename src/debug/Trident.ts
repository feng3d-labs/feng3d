namespace feng3d
{
    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    export class Trident extends Component
    {
        @oav()
        lineLength = 1;

        @oav()
        arrowradius = 0.05;

        @oav()
        arrowHeight = 0.18;

        tridentObject: GameObject;

        init(gameObject: GameObject)
        {
            super.init(gameObject);
            var tridentObject = this.tridentObject = GameObject.create("trident");

            tridentObject.mouseEnabled = false;
            tridentObject.transform.showInInspector = false;
            gameObject.addChild(tridentObject);

            this.buildTrident();
        }

        private buildTrident()
        {
            var xLine = GameObject.create("xLine");
            xLine.showinHierarchy = false;
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.segments.push(new Segment(new Vector3(), new Vector3(this.lineLength, 0, 0), new Color4(1, 0, 0), new Color4(1, 0, 0)));
            segmentGeometry.invalidateGeometry();
            var meshRenderer = xLine.addComponent(MeshRenderer);
            meshRenderer.geometry = segmentGeometry;
            meshRenderer.material = materialFactory.create("segment", { renderParams: { renderMode: RenderMode.LINES } });
            this.tridentObject.addChild(xLine);
            //
            var yLine = GameObject.create("yLine");
            yLine.showinHierarchy = false;
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.segments.push(new Segment(new Vector3(), new Vector3(0, this.lineLength, 0), new Color4(0, 1, 0), new Color4(0, 1, 0)));
            segmentGeometry.invalidateGeometry();
            meshRenderer = yLine.addComponent(MeshRenderer);
            meshRenderer.material = materialFactory.create("segment", { renderParams: { renderMode: RenderMode.LINES } });
            meshRenderer.geometry = segmentGeometry;
            this.tridentObject.addChild(yLine);
            //
            var zLine = GameObject.create("zLine");
            zLine.showinHierarchy = false;
            var segmentGeometry = new SegmentGeometry();
            segmentGeometry.segments.push(new Segment(new Vector3(), new Vector3(0, 0, this.lineLength), new Color4(0, 0, 1), new Color4(0, 0, 1)));
            segmentGeometry.invalidateGeometry();
            meshRenderer = zLine.addComponent(MeshRenderer);
            meshRenderer.material = materialFactory.create("segment", { renderParams: { renderMode: RenderMode.LINES } });
            meshRenderer.geometry = segmentGeometry;
            this.tridentObject.addChild(zLine);
            //
            var xArrow = GameObject.create("xArrow");
            xArrow.showinHierarchy = false;
            xArrow.transform.x = this.lineLength;
            xArrow.transform.rz = -90;
            var meshRenderer = xArrow.addComponent(MeshRenderer);
            var material = meshRenderer.material = materialFactory.create("color");
            meshRenderer.geometry = new ConeGeometry({ bottomRadius: this.arrowradius, height: this.arrowHeight });;
            material.uniforms.u_diffuseInput = new Color4(1, 0, 0);
            this.tridentObject.addChild(xArrow);
            //
            var yArrow = GameObject.create("yArrow");
            yArrow.showinHierarchy = false;
            yArrow.transform.y = this.lineLength;
            meshRenderer = yArrow.addComponent(MeshRenderer);
            var material = meshRenderer.material = materialFactory.create("color");
            meshRenderer.geometry = new ConeGeometry({ bottomRadius: this.arrowradius, height: this.arrowHeight });
            material.uniforms.u_diffuseInput = new Color4(0, 1, 0);
            this.tridentObject.addChild(yArrow);
            //
            var zArrow = GameObject.create("zArrow");
            zArrow.showinHierarchy = false;
            zArrow.transform.z = this.lineLength;
            zArrow.transform.rx = 90;
            meshRenderer = zArrow.addComponent(MeshRenderer);
            meshRenderer.geometry = new ConeGeometry({ bottomRadius: this.arrowradius, height: this.arrowHeight });
            var material = meshRenderer.material = materialFactory.create("color");
            material.uniforms.u_diffuseInput = new Color4(0, 0, 1);
            this.tridentObject.addChild(zArrow);
        }
    }
}