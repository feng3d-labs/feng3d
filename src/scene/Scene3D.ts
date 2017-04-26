module feng3d
{

    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    export class Scene3D extends GameObject
    {
        /**
         * 背景颜色
         */
        public background = new Color(0, 0, 0, 1);
        /**
         * 环境光强度
         */
        public ambientColor = new Color();

        private _object3Ds: GameObject[] = [];
        private _renderers: Model[] = [];
        private _lights: Light[] = [];

        /**
         * 渲染列表
         */
        public get renderers()
        {
            return this._renderers;
        }

        /**
         * 灯光列表
         */
        public get lights()
        {
            return this._lights;
        }

        /**
         * 构造3D场景
         */
        constructor()
        {
            super("root");
            this._scene = this;
            this._isRoot = true;
            //
            this.addEventListener(Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.addEventListener(Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
        }

        /**
         * 处理添加对象事件
         */
        private onAddedToScene(event: Scene3DEvent)
        {
            if (event.data instanceof GameObject)
            {
                var gameObject = event.data;
                var model = gameObject.getComponentByType(Model);
                model && this.renderers.push(model);
                var light = gameObject.getComponentByType(Light);
                light && this.lights.push(light);
                //
                gameObject.addEventListener(ComponentEvent.ADDED_COMPONENT, this.onAddedComponent, this);
                gameObject.addEventListener(ComponentEvent.REMOVED_COMPONENT, this.onRemovedComponent, this);
                //
                this._object3Ds.push(gameObject);
            }
        }

        /**
         * 处理移除对象事件
         */
        private onRemovedFromScene(event: Scene3DEvent)
        {
            if (event.data instanceof GameObject)
            {
                var gameObject = event.data;
                var model = gameObject.getComponentByType(Model);
                if (model)
                {
                    var index = this.renderers.indexOf(model);
                    if (index != -1)
                    {
                        this.renderers.splice(index, 1);
                    }
                }
                var light = gameObject.getComponentByType(Light);
                if (light)
                {
                    var index = this.lights.indexOf(light);
                    if (index != -1)
                    {
                        this.lights.splice(index, 1);
                    }
                }
                //
                gameObject.removeEventListener(ComponentEvent.ADDED_COMPONENT, this.onAddedComponent, this);
                gameObject.removeEventListener(ComponentEvent.REMOVED_COMPONENT, this.onRemovedComponent, this);
                //
                var index = this._object3Ds.indexOf(gameObject);
                debuger && assert(index != -1)
                this._object3Ds.splice(index, 1);
            }
        }

        /**
         * 处理添加组件 
         */
        private onAddedComponent(event: ComponentEvent)
        {
            var component = event.data.child;
            if (component instanceof Light)
            {
                this.lights.push(component);
            }
            if (component instanceof Model)
            {
                this.renderers.push(component);
            }
        }

        /**
         * 处理删除组件 
         */
        private onRemovedComponent(event: ComponentEvent)
        {
            var component = event.data.child;
            if (component instanceof Light)
            {
                var index = this.lights.indexOf(component);
                if (index != -1)
                {
                    this.lights.splice(index, 1);
                }
            }
            if (component instanceof Model)
            {
                var index = this.renderers.indexOf(component);
                if (index != -1)
                {
                    this.renderers.splice(index, 1);
                }
            }
        }
    }
}