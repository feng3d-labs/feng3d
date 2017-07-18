namespace feng3d
{
    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    export class DirectionalLight extends Light
    {
        static get directionalLights()
        {
            return this._directionalLights;
        }
        private static _directionalLights: DirectionalLight[] = [];

        private _direction: Vector3D;
        private _sceneDirection: Vector3D;

        /**
         * 构建
         */
        constructor(gameObject: GameObject)
        {
            super(gameObject);
            this.lightType = LightType.Directional;
            var xDir = 0, yDir = -1, zDir = 1
            this._sceneDirection = new Vector3D();
            this.direction = new Vector3D(xDir, yDir, zDir);
            //
            DirectionalLight._directionalLights.push(this);
        }

        get sceneDirection(): Vector3D
        {
            return this._sceneDirection;
        }

        /**
         * 光照方向
         */
        get direction(): Vector3D
        {
            return this._direction;
        }

        set direction(value: Vector3D)
        {
            this._direction = value;
            if (this.gameObject)
            {
                var tmpLookAt = this.gameObject.transform.position;
                tmpLookAt.incrementBy(this._direction);
                this.gameObject.transform.lookAt(tmpLookAt);
                this.gameObject.transform.localToWorldMatrix.copyColumnTo(2, this._sceneDirection);
                this._sceneDirection.normalize();
            }
        }

        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: EventVO<any>): void
        {
            Event.on(this.gameObject.transform, <any>Object3DEvent.SCENETRANSFORM_CHANGED, this.onScenetransformChanged, this);
            var tmpLookAt = this.gameObject.transform.position;
            tmpLookAt.incrementBy(this._direction);
            this.gameObject.transform.lookAt(tmpLookAt);
        }

        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: EventVO<any>): void
        {
            Event.off(this.gameObject.transform, <any>Object3DEvent.SCENETRANSFORM_CHANGED, this.onScenetransformChanged, this);
        }

        protected onScenetransformChanged()
        {
            this.gameObject.transform.localToWorldMatrix.copyColumnTo(2, this._sceneDirection);
            this._sceneDirection.normalize();
        }
    }
}