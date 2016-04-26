module me.feng3d {
    /**
     * 3D空间
     * @author feng 2016-04-26
     */
    export class Space3D extends Component {
        /**
         * X坐标
         */
        x: number = 0;
        /**
         * Y坐标
         */
        y: number = 0;
        /**
         * Z坐标
         */
        z: number = 0;
        /**
         * X旋转
         */
        rx: number = 0;
        /**
         * Y旋转
         */
        ry: number = 0;
        /**
         * Z旋转
         */
        rz: number = 0;
        /**
         * X缩放
         */
        sx: number = 1;
        /**
         * Y缩放
         */
        sy: number = 1;
        /**
         * Z缩放
         */
        sz: number = 1;

        get matrix3D(): Matrix3D {
            var mat = new Matrix3D();
            mat.recompose([//
                new Vector3D(this.x, this.y, this.z),//
                new Vector3D(this.rx * MathConsts.DEGREES_TO_RADIANS, this.ry * MathConsts.DEGREES_TO_RADIANS, this.rz * MathConsts.DEGREES_TO_RADIANS),//
                new Vector3D(this.sx, this.sy, this.sz),//
            ])
            return mat;
        }
    }
}