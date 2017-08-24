declare namespace feng3d {
    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    class Engine {
        gl: GL;
        /**
         * 摄像机
         */
        camera: Camera;
        /**
         * 3d场景
         */
        scene: Scene3D;
        canvas: HTMLCanvasElement;
        /**
         * 默认渲染器
         */
        private defaultRenderer;
        /**
         * 鼠标事件管理器
         */
        private mouse3DManager;
        /**
         * 阴影图渲染器
         */
        private shadowRenderer;
        /**
         * 渲染环境
         */
        private renderContext;
        /**
         * 鼠标在3D视图中的位置
         */
        readonly mousePos: Point;
        viewRect: Rectangle;
        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas?: HTMLCanvasElement, scene?: Scene3D, camera?: Camera);
        start(): void;
        stop(): void;
        update(): void;
        /**
         * 绘制场景
         */
        render(): void;
        static get(canvas?: HTMLCanvasElement): Engine;
    }
}
