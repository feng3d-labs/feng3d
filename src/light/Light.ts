module feng3d {

    /**
     * 灯光
     * @author feng 2016-12-12
     */
    export class Light extends Object3DComponent {

        /**
         * 灯光类型
         */
        public type: LightType;

        /**
         * 颜色
         */
        public color: Color;
    }
}