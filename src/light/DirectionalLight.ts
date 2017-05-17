module feng3d
{
    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    export class DirectionalLight extends Light
    {
        private _direction: Vector3D;
        private _sceneDirection: Vector3D;

        /**
         * 构建
         */
        constructor(xDir: number = 0, yDir: number = -1, zDir: number = 1)
        {
            super();
            this.lightType = LightType.Directional;
            this.direction = new Vector3D(xDir, yDir, zDir);
            this._sceneDirection = new Vector3D(xDir, yDir, zDir);
            this._sceneDirection.normalize();
        }

        public get sceneDirection(): Vector3D
        {            
            return this._sceneDirection;
        }

        /**
         * 光照方向
         */
        public get direction(): Vector3D
        {
            return this._direction;
        }

        public set direction(value: Vector3D)
        {
            this._direction = value;
            if(this._parentComponent)
            {
                var tmpLookAt = this._parentComponent.getPosition();
                tmpLookAt.incrementBy(this._direction);
                this._parentComponent.lookAt(tmpLookAt);
                this._parentComponent.sceneTransform.copyColumnTo(2, this._sceneDirection);
                this._sceneDirection.normalize();
            }
        }

        public get parentComponent()
        {
            return this._parentComponent;
        }
        public set parentComponent(value)
        {
            if(this._parentComponent)
            {
                this._parentComponent.removeEventListener(Object3DEvent.SCENETRANSFORM_CHANGED,this.onScenetransformChanged,this);
            }
            this._parentComponent = value;
            if(this._parentComponent)
            {
                this._parentComponent.addEventListener(Object3DEvent.SCENETRANSFORM_CHANGED,this.onScenetransformChanged,this);
                var tmpLookAt = this._parentComponent.getPosition();
                tmpLookAt.incrementBy(this._direction);
                this._parentComponent.lookAt(tmpLookAt);
            }
        }
        
        protected onScenetransformChanged()
        {
            this._parentComponent.sceneTransform.copyColumnTo(2, this._sceneDirection);
            this._sceneDirection.normalize();
        }
    }
}