namespace feng3d
{

    export interface ComponentMap { Water: Water }

    /**
     * The Water component renders the terrain.
     */
    @AddComponentMenu("Graphics/Water")
    @RegisterComponent()
    export class Water extends Renderable
    {
        __class__: "feng3d.Water";

        @AddEntityMenu("Node3D/Water")
        static create(name = "Water")
        {
            var water = new Entity().addComponent(Water);
            water.name = name;
            return water;
        }

        geometry = Geometry.getDefault("Plane");

        material = Material.getDefault("Water-Material");

        /**
         * 帧缓冲对象，用于处理水面反射
         */
        private frameBufferObject = new FrameBufferObject();

        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {
            var uniforms = <WaterUniforms>this.material.uniforms;
            var sun = this.node3d.scene.activeDirectionalLights[0];
            if (sun)
            {
                uniforms.u_sunColor = sun.color;
                uniforms.u_sunDirection = sun.node3d.localToWorldMatrix.getAxisZ().negate();
            }

            var clipBias = 0;

            uniforms.u_time += 1.0 / 60.0;

            // this.material.uniforms.s_mirrorSampler.url = "Assets/floor_diffuse.jpg";

            super.beforeRender(renderAtomic, scene, camera);

            if (1) return;
            //
            var mirrorWorldPosition = this.node3d.worldPosition;
            var cameraWorldPosition = camera.node3d.worldPosition;

            var rotationMatrix = this.node3d.rotationMatrix;

            var normal = rotationMatrix.getAxisZ();

            var view = mirrorWorldPosition.subTo(cameraWorldPosition);
            if (view.dot(normal) > 0) return;

            view.reflect(normal).negate();
            view.add(mirrorWorldPosition);

            rotationMatrix = camera.node3d.rotationMatrix;

            var lookAtPosition = new Vector3(0, 0, -1);
            lookAtPosition.applyMatrix4x4(rotationMatrix);
            lookAtPosition.add(cameraWorldPosition);

            var target = mirrorWorldPosition.subTo(lookAtPosition);
            target.reflect(normal).negate();
            target.add(mirrorWorldPosition);

            var mirrorCamera = serialization.setValue(new Entity(), { name: "waterMirrorCamera" }).addComponent(Camera);
            mirrorCamera.node3d.x = view.x;
            mirrorCamera.node3d.y = view.y;
            mirrorCamera.node3d.z = view.z;
            mirrorCamera.node3d.lookAt(target, rotationMatrix.getAxisY());

            mirrorCamera.lens = camera.lens.clone();

            var textureMatrix = new Matrix4x4(
                [
                    0.5, 0.0, 0.0, 0.0,
                    0.0, 0.5, 0.0, 0.0,
                    0.0, 0.0, 0.5, 0.0,
                    0.5, 0.5, 0.5, 1.0
                ]
            );
            textureMatrix.append(mirrorCamera.viewProjection);

            var mirrorPlane = Plane.fromNormalAndPoint(mirrorCamera.node3d.worldToLocalMatrix.transformVector3(normal), mirrorCamera.node3d.worldToLocalMatrix.transformPoint3(mirrorWorldPosition));
            var clipPlane = new Vector4(mirrorPlane.a, mirrorPlane.b, mirrorPlane.c, mirrorPlane.d);

            var projectionMatrix = mirrorCamera.lens.matrix;

            var q = new Vector4();
            q.x = (clipPlane.x / Math.abs(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
            q.y = (clipPlane.y / Math.abs(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
            q.z = - 1.0;
            q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

            clipPlane.scale(2.0 / clipPlane.dot(q));

            projectionMatrix.elements[2] = clipPlane.x;
            projectionMatrix.elements[6] = clipPlane.y;
            projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
            projectionMatrix.elements[14] = clipPlane.w;

            var eye = camera.node3d.worldPosition;

            // 不支持直接操作gl，下面代码暂时注释掉！
            // // 
            // var frameBufferObject = this.frameBufferObject;
            // FrameBufferObject.active(gl, frameBufferObject);

            // //
            // gl.viewport(0, 0, frameBufferObject.OFFSCREEN_WIDTH, frameBufferObject.OFFSCREEN_HEIGHT);
            // gl.clearColor(1.0, 1.0, 1.0, 1.0);
            // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // skyboxRenderer.draw(gl, scene, mirrorCamera);
            // // forwardRenderer.draw(gl, scene, mirrorCamera);
            // // forwardRenderer.draw(gl, scene, camera);

            // frameBufferObject.deactive(gl);

            //
            // this.material.uniforms.s_mirrorSampler = frameBufferObject.texture;

            uniforms.u_textureMatrix = textureMatrix;
        }
    }

    Entity.registerPrimitive("Water", (g) =>
    {
        g.addComponent(Water);
    });

    export interface PrimitiveEntity
    {
        Water: Entity;
    }
}