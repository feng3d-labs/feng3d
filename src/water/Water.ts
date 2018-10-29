namespace feng3d
{

    export interface ComponentMap { Water: Water }

    /**
     * The Water component renders the terrain.
     */
    export class Water extends Model
    {
        __class__: "feng3d.Water" = "feng3d.Water";

        geometry = Geometry.plane;

        material = Material.water;

        /**
         * 帧缓冲对象，用于处理水面反射
         */
        private frameBufferObject = new FrameBufferObject();

        beforeRender(gl: GL, renderAtomic: RenderAtomic, scene3d: Scene3D, camera: Camera)
        {
            var uniforms = <feng3d.WaterUniforms>this.material.uniforms;
            var sun = this.gameObject.scene.activeDirectionalLights[0];
            if (sun)
            {
                uniforms.u_sunColor = sun.color;
                uniforms.u_sunDirection = sun.transform.localToWorldMatrix.forward.clone().negate();
            }

            var clipBias = 0;

            uniforms.u_time += 1.0 / 60.0;

            // this.material.uniforms.s_mirrorSampler.url = "Assets/floor_diffuse.jpg";

            super.beforeRender(gl, renderAtomic, scene3d, camera);

            if (1) return;
            //
            var mirrorWorldPosition = this.transform.scenePosition;
            var cameraWorldPosition = camera.transform.scenePosition;

            var rotationMatrix = this.transform.rotationMatrix;

            var normal = rotationMatrix.forward;

            var view = mirrorWorldPosition.subTo(cameraWorldPosition);
            if (view.dot(normal) > 0) return;

            view.reflect(normal).negate();
            view.add(mirrorWorldPosition);

            rotationMatrix = camera.transform.rotationMatrix;

            var lookAtPosition = new Vector3(0, 0, -1);
            lookAtPosition.applyMatrix4x4(rotationMatrix);
            lookAtPosition.add(cameraWorldPosition);

            var target = mirrorWorldPosition.subTo(lookAtPosition);
            target.reflect(normal).negate();
            target.add(mirrorWorldPosition);

            var mirrorCamera = Object.setValue(new GameObject(), { name: "waterMirrorCamera" }).addComponent(Camera);
            mirrorCamera.transform.position = view;
            mirrorCamera.transform.lookAt(target, rotationMatrix.up);

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

            var mirrorPlane = Plane3D.fromNormalAndPoint(mirrorCamera.transform.worldToLocalMatrix.deltaTransformVector(normal), mirrorCamera.transform.worldToLocalMatrix.transformVector(mirrorWorldPosition));
            var clipPlane = new Vector4(mirrorPlane.a, mirrorPlane.b, mirrorPlane.c, mirrorPlane.d);

            var projectionMatrix = mirrorCamera.lens.matrix;

            var q = new Vector4();
            q.x = (clipPlane.x / Math.abs(clipPlane.x) + projectionMatrix.rawData[8]) / projectionMatrix.rawData[0];
            q.y = (clipPlane.y / Math.abs(clipPlane.y) + projectionMatrix.rawData[9]) / projectionMatrix.rawData[5];
            q.z = - 1.0;
            q.w = (1.0 + projectionMatrix.rawData[10]) / projectionMatrix.rawData[14];

            clipPlane.scale(2.0 / clipPlane.dot(q));

            projectionMatrix.rawData[2] = clipPlane.x;
            projectionMatrix.rawData[6] = clipPlane.y;
            projectionMatrix.rawData[10] = clipPlane.z + 1.0 - clipBias;
            projectionMatrix.rawData[14] = clipPlane.w;

            var eye = camera.transform.scenePosition;

            // 
            var frameBufferObject = this.frameBufferObject;
            frameBufferObject.active(gl);

            //
            gl.viewport(0, 0, frameBufferObject.OFFSCREEN_WIDTH, frameBufferObject.OFFSCREEN_HEIGHT);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            skyboxRenderer.draw(gl, scene3d, mirrorCamera);
            // forwardRenderer.draw(gl, scene3d, mirrorCamera);
            // forwardRenderer.draw(gl, scene3d, camera);

            frameBufferObject.deactive(gl);

            //
            // this.material.uniforms.s_mirrorSampler = frameBufferObject.texture;

            uniforms.u_textureMatrix = textureMatrix;
        }
    }
}