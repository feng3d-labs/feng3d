module feng3d {
    /**
     * Orientation3D 类是用于表示 Matrix3D 对象的方向样式的常量值枚举。方向的三个类型分别为欧拉角、轴角和四元数。Matrix3D 对象的 decompose 和 recompose 方法采用其中的某一个枚举类型来标识矩阵的旋转组件。
     * @author feng 2016-3-21
     */
    export class Orientation3D {

        /**
        * 轴角方向结合使用轴和角度来确定方向。
        */
        public static AXIS_ANGLE: string = "axisAngle";

        /**
        * 欧拉角（decompose() 和 recompose() 方法的默认方向）通过三个不同的对应于每个轴的旋转角来定义方向。
        */
        public static EULER_ANGLES: string = "eulerAngles";

        /**
        * 四元数方向使用复数。
        */
        public static QUATERNION: string = "quaternion";
    }
} 