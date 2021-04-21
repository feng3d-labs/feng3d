namespace feng3d
{
    export interface EntityEventMap
    {
        lensChanged;
    }

    export interface ComponentMap { Camera: Camera; }

    /**
     * 摄像机
     */
    @AddComponentMenu("Rendering/Camera")
    @RegisterComponent({ single: true })
    export class Camera extends Component3D
    {
        @AddEntityMenu("Node3D/Camera")
        static create(name = "Camera")
        {
            var entity = new Entity();
            entity.name = name;
            var camera = entity.addComponent(Camera);
            return camera;
        }
        __class__: "feng3d.Camera";

        @oav({ component: "OAVEnum", componentParam: { enumClass: Projection } })
        get projection()
        {
            return this.lens && this.lens.projectionType;
        }
        set projection(v)
        {
            var projectionType = this.projection;
            if (projectionType == v) return;
            //
            var aspect = 1;
            var near = 0.3;
            var far = 1000;
            if (this.lens)
            {
                aspect = this.lens.aspect;
                near = this.lens.near;
                far = this.lens.far;
                serialization.setValue(this._backups, <any>this.lens);
            }
            var fov = this._backups ? this._backups.fov : 60;
            var size = this._backups ? this._backups.size : 1;
            if (v == Projection.Perspective)
            {
                this.lens = new PerspectiveLens(fov, aspect, near, far);
            } else
            {
                this.lens = new OrthographicLens(size, aspect, near, far);
            }
        }

        /**
         * 镜头
         */
        @serialize
        @oav({ component: "OAVObjectView" })
        get lens()
        {
            return this._lens;
        }
        set lens(v)
        {
            if (this._lens == v) return;

            if (this._lens)
            {
                this._lens.off("lensChanged", this.invalidateViewProjection, this);
            }
            this._lens = v;
            if (this._lens)
            {
                this._lens.on("lensChanged", this.invalidateViewProjection, this);
            }

            this.invalidateViewProjection();

            this.emit("refreshView");
            this.emit("lensChanged");
        }
        private _lens: LensBase;

        /**
         * 场景投影矩阵，世界空间转投影空间
         */
        get viewProjection(): Matrix4x4
        {
            if (this._viewProjectionInvalid)
            {
                //场景空间转摄像机空间
                this._viewProjection.copy(this.node3d.worldToLocalMatrix);
                //+摄像机空间转投影空间 = 场景空间转投影空间
                this._viewProjection.append(this.lens.matrix);
                this._viewProjectionInvalid = false;
            }

            return this._viewProjection;
        }

        /**
         * 获取摄像机的截头锥体
         */
        get frustum()
        {
            if (this._frustumInvalid)
            {
                this._frustum.fromMatrix(this.viewProjection);
                this._frustumInvalid = false;
            }
            return this._frustum;
        }

        /**
         * 创建一个摄像机
         */
        init()
        {
            super.init();
            this.lens = this.lens || new PerspectiveLens();
            //
            this.on("scenetransformChanged", this.invalidateViewProjection, this);
            this.invalidateViewProjection();
        }

        /**
         * 获取与坐标重叠的射线
         * @param x view3D上的X坐标
         * @param y view3D上的X坐标
         * @return
         */
        getRay3D(x: number, y: number, ray3D = new Ray3()): Ray3
        {
            return this.lens.unprojectRay(x, y, ray3D).applyMatri4x4(this.node3d.localToWorldMatrix);
        }

        /**
         * 投影坐标（世界坐标转换为3D视图坐标）
         * @param point3d 世界坐标
         * @return 屏幕的绝对坐标
         */
        project(point3d: Vector3): Vector3
        {
            var v: Vector3 = this.lens.project(this.node3d.worldToLocalMatrix.transformPoint3(point3d));
            return v;
        }

        /**
         * 屏幕坐标投影到场景坐标
         * @param nX 屏幕坐标X ([0-width])
         * @param nY 屏幕坐标Y ([0-height])
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        unproject(sX: number, sY: number, sZ: number, v = new Vector3()): Vector3
        {
            return this.node3d.localToWorldMatrix.transformPoint3(this.lens.unprojectWithDepth(sX, sY, sZ, v), v);
        }

        /**
         * 获取摄像机能够在指定深度处的视野；镜头在指定深度的尺寸。
         * 
         * @param   depth   深度
         */
        getScaleByDepth(depth: number, dir = new Vector2(0, 1))
        {
            var lt = this.unproject(- 0.5 * dir.x, - 0.5 * dir.y, depth);
            var rb = this.unproject(+ 0.5 * dir.x, + 0.5 * dir.y, depth);
            var scale = lt.subTo(rb).length;
            return scale;
        }

        /**
         * 处理场景变换改变事件
         */
        protected invalidateViewProjection()
        {
            this._viewProjectionInvalid = true;
            this._frustumInvalid = true;
        }

        //
        private _viewProjection: Matrix4x4 = new Matrix4x4();
        private _viewProjectionInvalid = true;
        private _backups = { fov: 60, size: 1 };
        private _frustum = new Frustum()
        private _frustumInvalid = true;

    }
    // 投影后可视区域
    var visibleBox = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

    Entity.registerPrimitive("Camera", (g) =>
    {
        g.addComponent(Camera);
    });

    export interface PrimitiveEntity
    {
        Camera: Entity;
    }
}
