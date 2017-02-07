module feng3d {

    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    export class Trident extends Object3D {

        constructor(length = 100, showLetters = true) {
            super();
            this.buildTrident(Math.abs((length == 0) ? 10 : length), showLetters);
        }

        private buildTrident(length: number, showLetters: boolean) {
            var scaleH: number = length / 10;
            var scaleW: number = length / 20;
            var scl1: number = scaleW * 1.5;
            var scl2: number = scaleH * 3;
            var scl3: number = scaleH * 2;
            var scl4: number = scaleH * 3.4;
            var cross: number = length + (scl3) + (((length + scl4) - (length + scl3)) / 3 * 2);

            var arr = [ //
                [new Vector3D(), new Vector3D(length, 0, 0), 0x880000, 0xff0000, 1], //X轴
                //X
                [new Vector3D(length + scl2, scl1, 0), new Vector3D(length + scl3, -scl1, 0), 0xff0000, 0xff0000, 1], //
                [new Vector3D(length + scl3, scl1, 0), new Vector3D(length + scl2, -scl1, 0), 0xff0000, 0xff0000, 1], //

                [new Vector3D(), new Vector3D(0, length, 0), 0x008800, 0x00ff00, 1], //Y轴
                //Y
                [new Vector3D(-scaleW * 1.2, length + scl4, 0), new Vector3D(0, cross, 0), 0x00ff00, 0x00ff00, 1], //
                [new Vector3D(scaleW * 1.2, length + scl4, 0), new Vector3D(0, cross, 0), 0x00ff00, 0x00ff00, 1], //
                [new Vector3D(0, cross, 0), new Vector3D(0, length + scl3, 0), 0x00ff00, 0x00ff00, 1], //

                [new Vector3D(), new Vector3D(0, 0, length), 0x000088, 0x0000ff, 1], //Z轴
                //Z
                [new Vector3D(0, scl1, length + scl2), new Vector3D(0, scl1, length + scl3), 0x0000ff, 0x0000ff, 1], //
                [new Vector3D(0, -scl1, length + scl2), new Vector3D(0, -scl1, length + scl3), 0x0000ff, 0x0000ff, 1], //
                [new Vector3D(0, -scl1, length + scl3), new Vector3D(0, scl1, length + scl2), 0x0000ff, 0x0000ff, 1], //
            ];

            var groundGridObject3D = new Object3D("GroundGrid");
            groundGridObject3D.getOrCreateComponentByClass(MeshRenderer).material = new SegmentMaterial();
            groundGridObject3D.transform.y = -50;
            var segmentGeometry = new SegmentGeometry();
            var geometry = groundGridObject3D.getOrCreateComponentByClass(Geometry);
            geometry.addComponent(segmentGeometry);

            var segmentX: Segment;
            for (var i: number = 0; i < arr.length; i++) {
                segmentX = new Segment(as(arr[i][0], Vector3D), as(arr[i][1], Vector3D), Number(arr[i][2]), Number(arr[i][3]), Number(arr[i][4]));
                segmentGeometry.addSegment(segmentX);
            }
            this.addChild(groundGridObject3D);
        }
    }
}