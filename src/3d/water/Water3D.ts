import { RegisterComponent } from '@feng3d/ecs';
import { Matrix4x4, Plane, Vector3, Vector4 } from '@feng3d/math';
import { RenderAtomic } from '@feng3d/renderer';
import { FrameBuffer } from '@feng3d/renderer/src/FrameBuffer';
import { $set } from '@feng3d/serialization';

import { Node3D } from '../../3d/core/Node3D';
import { Geometry } from '../../3d/geometrys/Geometry';
import { createNodeMenu } from '../../core/CreateNodeMenu';
import { Material } from '../../core/Material';
import { Camera3D } from '../cameras/Camera3D';
import { Component3D } from '../core/Component3D';
import { Mesh3D } from '../core/Mesh3D';
import { Scene3D } from '../core/Scene3D';
import { Water3DUniforms } from './WaterMaterial3D';

declare module '@feng3d/ecs' { interface ComponentMap { Water3D: Water3D } }

declare module '../../3d/core/Node3D' { export interface PrimitiveNode3D { Water3D: Node3D; } }

/**
 * The Water component renders the terrain.
 */
@RegisterComponent({ name: 'Water3D', dependencies: ['Mesh3D'], menu: 'Graphics/Water3D' })
export class Water3D extends Component3D
{
    declare __class__: 'Water3D';

    private meshRenderer: Mesh3D;

    init()
    {
        this.meshRenderer = this.getComponent('Mesh3D');
        this.meshRenderer.geometry = Geometry.getDefault('Plane');
        this.meshRenderer.material = Material.getDefault('Water-Material');
    }

    destroy(): void
    {
        this.meshRenderer.geometry = null;
        this.meshRenderer.material = null;
        this.meshRenderer = null;

        super.destroy();
    }

    /**
     * 帧缓冲对象，用于处理水面反射
     */
    private frameBufferObject = new FrameBuffer();

    beforeRender(renderAtomic: RenderAtomic, scene: Scene3D, camera: Camera3D)
    {
        const uniforms = this.meshRenderer.material.uniforms as Water3DUniforms;
        const sun = this.entity.scene.getComponentsInChildren('DirectionalLight3D').filter((dl) => dl.isVisibleAndEnabled)[0];
        if (sun)
        {
            uniforms.u_sunColor = sun.color;
            uniforms.u_sunDirection = sun.entity.globalMatrix.getAxisZ().negate();
        }

        const clipBias = 0;

        uniforms.u_time += 1.0 / 60.0;

        // this.material.uniforms.s_mirrorSampler.url = "Assets/floor_diffuse.jpg";

        super.beforeRender(renderAtomic, scene, camera);

        // eslint-disable-next-line no-constant-condition
        if (1) return;
        //
        const mirrorGlobalPosition = this.entity.globalPosition;
        const cameraGlobalPosition = camera.entity.globalPosition;

        let rotationMatrix = this.entity.rotationMatrix;

        const normal = rotationMatrix.getAxisZ();

        const view = mirrorGlobalPosition.subTo(cameraGlobalPosition);
        if (view.dot(normal) > 0) return;

        view.reflect(normal).negate();
        view.add(mirrorGlobalPosition);

        rotationMatrix = camera.entity.rotationMatrix;

        const lookAtPosition = new Vector3(0, 0, -1);
        lookAtPosition.applyMatrix4x4(rotationMatrix);
        lookAtPosition.add(cameraGlobalPosition);

        const target = mirrorGlobalPosition.subTo(lookAtPosition);
        target.reflect(normal).negate();
        target.add(mirrorGlobalPosition);

        const mirrorCamera = $set(new Node3D(), { name: 'waterMirrorCamera' }).addComponent('Camera3D');
        mirrorCamera.entity.position = view;
        mirrorCamera.entity.lookAt(target, rotationMatrix.getAxisY());

        mirrorCamera.projectionMatrix.copy(camera.projectionMatrix);
        mirrorCamera.inversepPojectionMatrix.copy(camera.inversepPojectionMatrix);

        const textureMatrix = new Matrix4x4(
            [
                0.5, 0.0, 0.0, 0.0,
                0.0, 0.5, 0.0, 0.0,
                0.0, 0.0, 0.5, 0.0,
                0.5, 0.5, 0.5, 1.0
            ]
        );
        textureMatrix.append(mirrorCamera.viewProjection);

        const mirrorPlane = new Plane().fromNormalAndPoint(mirrorCamera.entity.invertGlobalMatrix.transformVector3(normal), mirrorCamera.entity.invertGlobalMatrix.transformPoint3(mirrorGlobalPosition));
        const clipPlane = new Vector4(mirrorPlane.a, mirrorPlane.b, mirrorPlane.c, mirrorPlane.d);

        const projectionMatrix = mirrorCamera.projectionMatrix;

        const q = new Vector4();
        q.x = (clipPlane.x / Math.abs(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
        q.y = (clipPlane.y / Math.abs(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
        q.z = -1.0;
        q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

        clipPlane.scaleNumber(2.0 / clipPlane.dot(q));

        projectionMatrix.elements[2] = clipPlane.x;
        projectionMatrix.elements[6] = clipPlane.y;
        projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
        projectionMatrix.elements[14] = clipPlane.w;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const eye = camera.entity.globalPosition;

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

Node3D.registerPrimitive('Water3D', (g) =>
{
    g.addComponent('Water3D');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
    {
        path: '3D Object/Water3D',
        priority: -20000,
        click: () =>
            Node3D.createPrimitive('Water3D')
    }
);

