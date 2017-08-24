var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var feng3d;
(function (feng3d) {
    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    var Trident = (function (_super) {
        __extends(Trident, _super);
        function Trident(gameObject) {
            var _this = _super.call(this, gameObject) || this;
            _this.gameObject.mouseEnabled = false;
            gameObject.serializable = false;
            var length = 100;
            _this.buildTrident(Math.abs((length == 0) ? 10 : length));
            return _this;
        }
        Trident.prototype.buildTrident = function (length) {
            var xLine = feng3d.GameObject.create("xLine");
            var segmentGeometry = new feng3d.SegmentGeometry();
            segmentGeometry.addSegment(new feng3d.Segment(new feng3d.Vector3D(), new feng3d.Vector3D(length, 0, 0), 0xff0000, 0xff0000));
            xLine.addComponent(feng3d.MeshFilter).mesh = segmentGeometry;
            xLine.addComponent(feng3d.MeshRenderer).material = new feng3d.SegmentMaterial();
            this.gameObject.addChild(xLine);
            //
            var yLine = feng3d.GameObject.create("yLine");
            var segmentGeometry = new feng3d.SegmentGeometry();
            segmentGeometry.addSegment(new feng3d.Segment(new feng3d.Vector3D(), new feng3d.Vector3D(0, length, 0), 0x00ff00, 0x00ff00));
            yLine.addComponent(feng3d.MeshFilter).mesh = segmentGeometry;
            yLine.addComponent(feng3d.MeshRenderer).material = new feng3d.SegmentMaterial();
            this.gameObject.addChild(yLine);
            //
            var zLine = feng3d.GameObject.create("zLine");
            var segmentGeometry = new feng3d.SegmentGeometry();
            segmentGeometry.addSegment(new feng3d.Segment(new feng3d.Vector3D(), new feng3d.Vector3D(0, 0, length), 0x0000ff, 0x0000ff));
            zLine.addComponent(feng3d.MeshFilter).mesh = segmentGeometry;
            zLine.addComponent(feng3d.MeshRenderer).material = new feng3d.SegmentMaterial();
            this.gameObject.addChild(zLine);
            //
            var xArrow = feng3d.GameObject.create("xArrow");
            xArrow.transform.x = length;
            xArrow.transform.rz = -90;
            xArrow.addComponent(feng3d.MeshFilter).mesh = new feng3d.ConeGeometry(5, 18);
            ;
            var material = xArrow.addComponent(feng3d.MeshRenderer).material = new feng3d.ColorMaterial();
            material.color = new feng3d.Color(1, 0, 0);
            this.gameObject.addChild(xArrow);
            //
            var yArrow = feng3d.GameObject.create("yArrow");
            yArrow.transform.y = length;
            yArrow.addComponent(feng3d.MeshFilter).mesh = new feng3d.ConeGeometry(5, 18);
            var material = yArrow.addComponent(feng3d.MeshRenderer).material = new feng3d.ColorMaterial();
            material.color = new feng3d.Color(0, 1, 0);
            this.gameObject.addChild(yArrow);
            //
            var zArrow = feng3d.GameObject.create("zArrow");
            zArrow.transform.z = length;
            zArrow.transform.rx = 90;
            zArrow.addComponent(feng3d.MeshFilter).mesh = new feng3d.ConeGeometry(5, 18);
            var material = zArrow.addComponent(feng3d.MeshRenderer).material = new feng3d.ColorMaterial();
            material.color = new feng3d.Color(0, 0, 1);
            this.gameObject.addChild(zArrow);
        };
        return Trident;
    }(feng3d.Component));
    feng3d.Trident = Trident;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Trident.js.map