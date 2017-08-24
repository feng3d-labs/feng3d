declare namespace feng3d {
    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    class Scene3D extends Component {
        /**
         * 背景颜色
         */
        background: Color;
        /**
         * 环境光强度
         */
        ambientColor: Color;
        /**
         * 构造3D场景
         */
        constructor(gameObject: GameObject);
    }
}
