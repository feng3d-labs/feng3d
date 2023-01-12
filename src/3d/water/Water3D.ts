import { Camera3D } from '../cameras/Camera3D';
import { Component3D } from '../core/Component3D';
import { Mesh3D } from '../core/Mesh3D';
import { Node3D } from '../../3d/core/Node3D';
import { Scene3D } from '../core/Scene3D';
import { Geometry } from '../../3d/geometrys/Geometry';
import { RegisterComponent } from '../../ecs/Component';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Plane } from '../../math/geom/Plane';
import { Vector3 } from '../../math/geom/Vector3';
import { Vector4 } from '../../math/geom/Vector4';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { $set } from '../../serialization/Serialization';
import { Material } from '../../core/Material';
import { createNodeMenu } from '../../core/menu/CreateNodeMenu';
import { FrameBufferObject } from '../../renderer/FrameBufferObject';
import { Water3DUniforms } from './WaterMaterial3D';

declare module '../../ecs/Component' { interface ComponentMap { Water3D: Water3D } }

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

    dispose(): void
    {
        this.meshRenderer.geometry = null;
        this.meshRenderer.material = null;
        this.meshRenderer = null;

        super.dispose();
    }

    /**
     * 帧缓冲对象，用于处理水面反射
     */
    private frameBufferObject = new FrameBufferObject();

    beforeRender(renderAtomic: RenderAtomic, scene: Scene3D, camera: Camera3D)
    {
        const uniforms = this.meshRenderer.material.uniforms as Water3DUniforms;
        const sun = this.node3d.scene.getComponentsInChildren('DirectionalLight3D').filter((dl) => dl.isVisibleAndEnabled)[0];
        if (sun)
        {
            uniforms.u_sunColor = sun.color;
            uniforms.u_sunDirection = sun.node3d.globalMatrix.getAxisZ().negate();
        }

        const clipBias = 0;

        uniforms.u_time += 1.0 / 60.0;

        // this.material.uniforms.s_mirrorSampler.url = "Assets/floor_diffuse.jpg";

        super.beforeRender(renderAtomic, scene, camera);

        // eslint-disable-next-line no-constant-condition
        if (1) return;
        //
        const mirrorWorldPosition = this.node3d.worldPosition;
        const cameraWorldPosition = camera.node3d.worldPosition;

        let rotationMatrix = this.node3d.rotationMatrix;

        const normal = rotationMatrix.getAxisZ();

        const view = mirrorWorldPosition.subTo(cameraWorldPosition);
        if (view.dot(normal) > 0) return;

        view.reflect(normal).negate();
        view.add(mirrorWorldPosition);

        rotationMatrix = camera.node3d.rotationMatrix;

        const lookAtPosition = new Vector3(0, 0, -1);
        lookAtPosition.applyMatrix4x4(rotationMatrix);
        lookAtPosition.add(cameraWorldPosition);

        const target = mirrorWorldPosition.subTo(lookAtPosition);
        target.reflect(normal).negate();
        target.add(mirrorWorldPosition);

        const mirrorCamera = $set(new Node3D(), { name: 'waterMirrorCamera' }).addComponent('Camera3D');
        mirrorCamera.node3d.position = view;
        mirrorCamera.node3d.lookAt(target, rotationMatrix.getAxisY());

        mirrorCamera.lens = camera.lens.clone();

        const textureMatrix = new Matrix4x4(
            [
                0.5, 0.0, 0.0, 0.0,
                0.0, 0.5, 0.0, 0.0,
                0.0, 0.0, 0.5, 0.0,
                0.5, 0.5, 0.5, 1.0
            ]
        );
        textureMatrix.append(mirrorCamera.viewProjection);

        const mirrorPlane = new Plane().fromNormalAndPoint(mirrorCamera.node3d.globalInvertMatrix.transformVector3(normal), mirrorCamera.node3d.globalInvertMatrix.transformPoint3(mirrorWorldPosition));
        const clipPlane = new Vector4(mirrorPlane.a, mirrorPlane.b, mirrorPlane.c, mirrorPlane.d);

        const projectionMatrix = mirrorCamera.lens.matrix;

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
        const eye = camera.node3d.worldPosition;

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

