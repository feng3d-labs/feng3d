namespace feng3d
{

    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    export class Scene3D extends Component
    {
        /**
         * 背景颜色
         */
        public background = new Color(0, 0, 0, 1);
        /**
         * 环境光强度
         */
        public ambientColor = new Color();

        /**
         * 构造3D场景
         */
        constructor(gameObject: GameObject)
        {
            super(gameObject);
            gameObject.name = "scene";
            gameObject.transform["_scene"] = this;
            gameObject.transform._isRoot = true;
        }
    }
}