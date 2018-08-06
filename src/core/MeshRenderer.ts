namespace feng3d
{
    export interface ComponentRawMap
    {
        MeshRendererRaw: MeshRendererRaw
    }

    export interface MeshRendererRaw
    {
        __class__: "feng3d.MeshRenderer",
        geometry?: Geometrys,
        material?: ValueOf<MaterialRawMap>;
    }

    export class MeshRenderer extends Behaviour
    {
        get single() { return true; }

        /**
         * Returns the instantiated Mesh assigned to the mesh filter.
         */
        @oav({ component: "OAVPick", componentParam: { tooltip: "几何体，提供模型以形状", accepttype: "geometry", datatype: "geometry" } })
        @serialize
        get geometry()
        {
            return this._geometry;
        }
        set geometry(value)
        {
            if (this._geometry == value)
                return;
            if (this._geometry)
            {
                this._geometry.off("boundsInvalid", this.onBoundsInvalid, this);
            }
            this._geometry = value;
            if (this._geometry)
            {
                this._geometry.on("boundsInvalid", this.onBoundsInvalid, this);
            }
        }
        private _geometry: Geometry;

        /**
         * 材质
         * Returns the first instantiated Material assigned to the renderer.
         */
        @oav({ component: "OAVPick", componentParam: { tooltip: "材质，提供模型以皮肤", accepttype: "material", datatype: "material" } })
        @serialize
        @watch("materialChanged")
        material: Material;

        /**
         * 是否投射阴影
         */
        @oav()
        @serialize
        castShadows = true;

        /**
         * 是否接受阴影
         */
        @oav()
        @serialize
        receiveShadows = true;

        // shadowyType = 

        // SHADOWMAP_TYPE

        lightPicker: LightPicker;

        private _selfLocalBounds: Box | null;
        private _selfWorldBounds: Box | null;

		/**
		 * 自身局部包围盒
		 */
        get selfLocalBounds()
        {
            if (!this._selfLocalBounds)
                this.updateBounds();

            return this._selfLocalBounds;
        }

		/**
		 * 自身世界包围盒
		 */
        get selfWorldBounds()
        {
            if (!this._selfWorldBounds)
                this.updateWorldBounds();

            return this._selfWorldBounds;
        }

        /**
         * 世界包围盒
         */
        get worldBounds()
        {
            var box = this.selfWorldBounds;
            if (!box) box = new Box(this.transform.position, this.transform.position);
            this.gameObject.children.forEach(element =>
            {
                var ebox = element.getComponent(MeshRenderer).worldBounds;
                box.union(ebox);
            });
            return box;
        }

        constructor()
        {
            super();
            this.lightPicker = new LightPicker(this);
        }

        init(gameObject: GameObject)
        {
            super.init(gameObject);

            if (!this.geometry)
                this.geometry = new CubeGeometry();

            if (!this.material)
                this.material = materialFactory.create("standard");

            this.on("boundsInvalid", this.onBoundsChange, this);
            this.on("scenetransformChanged", this.invalidateSceneTransform, this);
        }

        beforeRender(gl: GL, renderAtomic: RenderAtomic, scene3d: Scene3D, camera: Camera)
        {
            renderAtomic.uniforms.u_modelMatrix = () => this.transform.localToWorldMatrix;
            renderAtomic.uniforms.u_ITModelMatrix = () => this.transform.ITlocalToWorldMatrix;
            renderAtomic.uniforms.u_mvMatrix = () => lazy.getvalue(renderAtomic.uniforms.u_modelMatrix).clone().append(lazy.getvalue(renderAtomic.uniforms.u_viewMatrix));
            renderAtomic.uniforms.u_ITMVMatrix = () => lazy.getvalue(renderAtomic.uniforms.u_mvMatrix).clone().invert().transpose();

            //
            this._geometry.beforeRender(renderAtomic);
            this.material.beforeRender(renderAtomic);
            this.lightPicker.beforeRender(renderAtomic);
        }

        /**
         * 销毁
         */
        dispose()
        {
            this.geometry = <any>null;
            this.material = <any>null;
            super.dispose();
        }

        private onBoundsInvalid(event: Event<Geometry>)
        {
            this.dispatch(<any>event.type, event.data);
        }

        private materialChanged()
        {
            if (this.material && this.material.constructor == Object)
            {
                error("material 必须继承与 Material!");
            }
        }


		/**
		 * @inheritDoc
		 */
        private invalidateSceneTransform()
        {
            this._selfWorldBounds = null;
        }

        /**
          * 判断射线是否穿过对象
          * @param ray3D
          * @return
          */
        isIntersectingRay(ray3D: Ray3D)
        {
            if (!this.selfLocalBounds)
                return null;

            var localNormal = new Vector3();

            //转换到当前实体坐标系空间
            var localRay = new Ray3D();

            this.transform.worldToLocalMatrix.transformVector(ray3D.position, localRay.position);
            this.transform.worldToLocalMatrix.deltaTransformVector(ray3D.direction, localRay.direction);

            //检测射线与边界的碰撞
            var rayEntryDistance = this.selfLocalBounds.rayIntersection(localRay.position, localRay.direction, localNormal);
            if (rayEntryDistance < 0)
                return null;

            var meshRenderer = this.getComponent(MeshRenderer);

            //保存碰撞数据
            var pickingCollisionVO: PickingCollisionVO = {
                gameObject: this.gameObject,
                localNormal: localNormal,
                localRay: localRay,
                rayEntryDistance: rayEntryDistance,
                ray3D: ray3D,
                rayOriginIsInsideBounds: rayEntryDistance == 0,
                geometry: meshRenderer.geometry,
                cullFace: meshRenderer.material.renderParams.cullFace,
            };

            return pickingCollisionVO;
        }

		/**
		 * 更新世界边界
		 */
        private updateWorldBounds()
        {
            if (this.selfLocalBounds && this.transform.localToWorldMatrix)
            {
                this._selfWorldBounds = this.selfLocalBounds.applyMatrix3DTo(this.transform.localToWorldMatrix);
            }
        }

        /**
         * 处理包围盒变换事件
         */
        private onBoundsChange()
        {
            this._selfLocalBounds = null;
            this._selfWorldBounds = null;
        }

        /**
		 * @inheritDoc
		 */
        private updateBounds()
        {
            var meshRenderer = this.gameObject.getComponent(MeshRenderer);
            if (meshRenderer && meshRenderer.geometry)
                this._selfLocalBounds = meshRenderer.geometry.bounding;
        }
    }
}