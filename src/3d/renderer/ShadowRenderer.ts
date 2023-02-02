import { Box3 } from '../../math/geom/Box3';
import { Rectangle } from '../../math/geom/Rectangle';
import { Vector3 } from '../../math/geom/Vector3';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { Shader } from '../../renderer/data/Shader';
import { Vec3 } from '../../renderer/data/Uniforms';
import { FrameBufferObject } from '../../renderer/FrameBufferObject';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { Camera3D } from '../cameras/Camera3D';
import { Node3D } from '../core/Node3D';
import { Renderable3D } from '../core/Renderable3D';
import { Scene3D } from '../core/Scene3D';
import { DirectionalLight3D } from '../light/DirectionalLight3D';
import { LightType } from '../light/LightType';
import { PointLight3D } from '../light/PointLight3D';
import { ShadowType } from '../light/shadow/ShadowType';
import { SpotLight3D } from '../light/SpotLight3D';

declare module '../../renderer/data/RenderAtomic' { interface RenderAtomic { shadowShader: Shader; } }

declare module '../../renderer/data/Uniforms'
{
    interface Uniforms
    {
        u_lightType: LightType;
        u_lightPosition: Vec3;
        u_shadowCameraNear: number;
        u_shadowCameraFar: number;
    }
}

export class ShadowRenderer
{
    private renderAtomic = new RenderAtomic();

    /**
     * 渲染
     */
    draw(gl: WebGLRenderer, scene: Scene3D, camera: Camera3D)
    {
        const pointLights = scene.getComponentsInChildren('PointLight3D').filter((pl) => (pl.isVisibleAndEnabled && pl.shadowType !== ShadowType.No_Shadows));
        for (let i = 0; i < pointLights.length; i++)
        {
            pointLights[i].updateDebugShadowMap(scene, camera);
            this.drawForPointLight(gl, pointLights[i], scene, camera);
        }

        const spotLights = scene.getComponentsInChildren('SpotLight3D').filter((sp) => (sp.isVisibleAndEnabled && sp.shadowType !== ShadowType.No_Shadows));
        for (let i = 0; i < spotLights.length; i++)
        {
            spotLights[i].updateDebugShadowMap(scene, camera);
            this.drawForSpotLight(gl, spotLights[i], scene, camera);
        }

        const directionalLights = scene.getComponentsInChildren('DirectionalLight3D').filter((dl) => (dl.isVisibleAndEnabled && dl.shadowType !== ShadowType.No_Shadows));
        for (let i = 0; i < directionalLights.length; i++)
        {
            directionalLights[i].updateDebugShadowMap(scene, camera);
            this.drawForDirectionalLight(gl, directionalLights[i], scene, camera);
        }
    }

    private drawForSpotLight(webGLRenderer: WebGLRenderer, light: SpotLight3D, scene: Scene3D, camera: Camera3D): any
    {
        const { gl, webGLContext } = webGLRenderer;
        FrameBufferObject.active(webGLRenderer, light.frameBufferObject);

        //
        gl.viewport(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
        webGLContext.clearColor(1.0, 1.0, 1.0, 1.0);
        webGLContext.clear(['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT']);

        //
        const fov = light.angle;
        const aspect = 1;
        const near = 0.1;
        const far = light.range;

        const shadowCamera = new Node3D().addComponent('PerspectiveCamera3D', {
            fov,
            aspect,
            near,
            far,
        });
        shadowCamera.node3d.globalMatrix = light.node3d.globalMatrix;

        // 保存生成阴影贴图时使用的VP矩阵
        light.shadowCameraNear = near;
        light.shadowCameraFar = far;
        light._shadowCameraViewProjection = shadowCamera.viewProjection;

        const renderAtomic = this.renderAtomic;

        // 获取影响阴影图的渲染对象
        const models = scene.getComponentsInChildren('Mesh3D').filter((mr) => shadowCamera.frustum.intersectsBox(mr.globalBounds));

        // 筛选投射阴影的渲染对象
        const castShadowsModels = models.filter((i) => i.castShadows);

        //
        renderAtomic.renderParams.useViewPort = true;
        renderAtomic.renderParams.viewPort = new Rectangle(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);

        //
        renderAtomic.uniforms.u_projectionMatrix = shadowCamera.projectionMatrix.elements;
        renderAtomic.uniforms.u_viewProjection = shadowCamera.viewProjection.elements;
        renderAtomic.uniforms.u_viewMatrix = shadowCamera.node3d.invertGlobalMatrix.elements;
        renderAtomic.uniforms.u_cameraMatrix = shadowCamera.node3d.globalMatrix.elements;
        renderAtomic.uniforms.u_cameraPos = shadowCamera.node3d.globalPosition.toArray() as Vec3;
        //
        renderAtomic.uniforms.u_lightType = light.lightType;
        renderAtomic.uniforms.u_lightPosition = light.node3d.globalPosition.toArray() as Vec3;
        renderAtomic.uniforms.u_shadowCameraNear = shadowCamera.near;
        renderAtomic.uniforms.u_shadowCameraFar = shadowCamera.far;

        castShadowsModels.forEach((renderable) =>
        {
            this.drawObject3D(webGLRenderer, renderable, scene, camera);
        });

        light.frameBufferObject.deactive(webGLRenderer);
    }

    private drawForPointLight(webGLRenderer: WebGLRenderer, light: PointLight3D, scene: Scene3D, camera: Camera3D): any
    {
        const { gl, webGLContext } = webGLRenderer;

        FrameBufferObject.active(webGLRenderer, light.frameBufferObject);

        //
        gl.viewport(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
        webGLContext.clearColor(1.0, 1.0, 1.0, 1.0);
        webGLContext.clear(['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT']);

        const vpWidth = light.shadowMapSize.x;
        const vpHeight = light.shadowMapSize.y;

        // These viewports map a cube-map onto a 2D texture with the
        // following orientation:
        //
        //  xzXZ
        //   y Y
        //
        // X - Positive x direction
        // x - Negative x direction
        // Y - Positive y direction
        // y - Negative y direction
        // Z - Positive z direction
        // z - Negative z direction

        // positive X
        cube2DViewPorts[0].init(vpWidth * 2, vpHeight, vpWidth, vpHeight);
        // negative X

        cube2DViewPorts[1].init(0, vpHeight, vpWidth, vpHeight);
        // positive Z
        cube2DViewPorts[2].init(vpWidth * 3, vpHeight, vpWidth, vpHeight);
        // negative Z
        cube2DViewPorts[3].init(vpWidth, vpHeight, vpWidth, vpHeight);
        // positive Y
        cube2DViewPorts[4].init(vpWidth * 3, 0, vpWidth, vpHeight);
        // negative Y
        cube2DViewPorts[5].init(vpWidth, 0, vpWidth, vpHeight);

        //
        const fov = 90;
        const aspect = 1;
        const near = 0.3;
        const far = light.range;

        const shadowCamera = new Node3D().addComponent('PerspectiveCamera3D', {
            fov,
            aspect,
            near,
            far
        });
        shadowCamera.node3d.position = light.node3d.position;

        //
        light.shadowCameraNear = near;
        light.shadowCameraFar = far;

        //
        const renderAtomic = this.renderAtomic;

        for (let face = 0; face < 6; face++)
        {
            shadowCamera.node3d.lookAt(light.node3d.globalPosition.addTo(cubeDirections[face]), cubeUps[face]);

            // 获取影响阴影图的渲染对象
            const models = scene.getComponentsInChildren('Mesh3D').filter((mr) => shadowCamera.frustum.intersectsBox(mr.globalBounds));

            // 筛选投射阴影的渲染对象
            const castShadowsModels = models.filter((i) => i.castShadows);

            //
            renderAtomic.renderParams.useViewPort = true;
            renderAtomic.renderParams.viewPort = cube2DViewPorts[face];

            //
            renderAtomic.uniforms.u_projectionMatrix = shadowCamera.projectionMatrix.elements;
            renderAtomic.uniforms.u_viewProjection = shadowCamera.viewProjection.elements;
            renderAtomic.uniforms.u_viewMatrix = shadowCamera.node3d.invertGlobalMatrix.elements;
            renderAtomic.uniforms.u_cameraMatrix = shadowCamera.node3d.globalMatrix.elements;
            renderAtomic.uniforms.u_cameraPos = shadowCamera.node3d.globalPosition.toArray() as Vec3;
            //
            renderAtomic.uniforms.u_lightType = light.lightType;
            renderAtomic.uniforms.u_lightPosition = light.node3d.globalPosition.toArray() as Vec3;
            renderAtomic.uniforms.u_shadowCameraNear = shadowCamera.near;
            renderAtomic.uniforms.u_shadowCameraFar = shadowCamera.far;

            castShadowsModels.forEach((renderable) =>
            {
                this.drawObject3D(webGLRenderer, renderable, scene, camera);
            });
        }
        light.frameBufferObject.deactive(webGLRenderer);
    }

    private drawForDirectionalLight(webGLRenderer: WebGLRenderer, light: DirectionalLight3D, scene: Scene3D, camera: Camera3D): any
    {
        // 获取影响阴影图的渲染对象
        const models = scene.getComponentsInChildren('Mesh3D').filter((model) => (
            (model.castShadows || model.receiveShadows)
            && !model.useMaterial.renderParams.enableBlend
            && model.useMaterial.renderParams.renderMode === 'TRIANGLES'));

        // 筛选投射阴影的渲染对象
        const castShadowsModels = models.filter((i) => i.castShadows);

        const globalBounds: Box3 = castShadowsModels.reduce((pre: Box3, i) =>
        {
            const box = i.node3d.boundingBox.globalBounds;
            if (!pre)
            {
                return box.clone();
            }
            pre.union(box);

            return pre;
        }, null) || new Box3(new Vector3(), new Vector3(1, 1, 1));

        //
        const center = globalBounds.getCenter();
        const radius = globalBounds.getSize().length / 2;
        // 默认近平面距离
        const near = 0.3;
        const size = radius;
        const far = near + radius * 2;

        // 初始化摄像机
        const shadowCamera = new Node3D().addComponent('OrthographicCamera3D', {
            size,
            near,
            far,
        });
        const direction = light.node3d.globalMatrix.getAxisZ();
        shadowCamera.node3d.position = center.addTo(direction.normalize(radius + near).negate());
        shadowCamera.node3d.lookAt(center, Vector3.Y_AXIS);

        // 保存生成阴影贴图时使用的VP矩阵
        light.shadowCameraNear = near;
        light.shadowCameraFar = far;
        light.shadowCameraPosition = shadowCamera.node3d.globalPosition;
        light._shadowCameraViewProjection = shadowCamera.viewProjection;

        //
        FrameBufferObject.active(webGLRenderer, light.frameBufferObject);

        const { gl, webGLContext } = webGLRenderer;

        //
        gl.viewport(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
        webGLContext.clearColor(1.0, 1.0, 1.0, 1.0);
        webGLContext.clear(['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT']);

        const renderAtomic = this.renderAtomic;
        //
        renderAtomic.renderParams.useViewPort = true;
        renderAtomic.renderParams.viewPort = new Rectangle(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
        //
        renderAtomic.uniforms.u_projectionMatrix = shadowCamera.projectionMatrix.elements;
        renderAtomic.uniforms.u_viewProjection = shadowCamera.viewProjection.elements;
        renderAtomic.uniforms.u_viewMatrix = shadowCamera.node3d.invertGlobalMatrix.elements;
        renderAtomic.uniforms.u_cameraMatrix = shadowCamera.node3d.globalMatrix.elements;
        renderAtomic.uniforms.u_cameraPos = shadowCamera.node3d.globalPosition.toArray() as Vec3;
        //
        renderAtomic.uniforms.u_lightType = light.lightType;
        renderAtomic.uniforms.u_lightPosition = shadowCamera.node3d.globalPosition.toArray() as Vec3;
        renderAtomic.uniforms.u_shadowCameraNear = shadowCamera.near;
        renderAtomic.uniforms.u_shadowCameraFar = shadowCamera.far;
        //
        castShadowsModels.forEach((renderable) =>
        {
            this.drawObject3D(webGLRenderer, renderable, scene, camera);
        });

        light.frameBufferObject.deactive(webGLRenderer);
    }

    /**
     * 绘制3D对象
     */
    private drawObject3D(webGLRenderer: WebGLRenderer, renderable: Renderable3D, scene: Scene3D, camera: Camera3D)
    {
        const renderAtomic = renderable.renderAtomic;
        renderable.beforeRender(renderAtomic, scene, camera);
        renderAtomic.shadowShader = renderAtomic.shadowShader || new Shader({ shaderName: 'shadow' });

        //
        this.renderAtomic.next = renderAtomic;
        this.renderAtomic.renderParams.cullFace = renderAtomic.renderParams.cullFace;

        // 使用shadowShader
        this.renderAtomic.shader = renderAtomic.shadowShader;
        webGLRenderer.render(this.renderAtomic);
        this.renderAtomic.shader = null;
    }
}

/**
 * 阴影图渲染器
 */
export const shadowRenderer = new ShadowRenderer();

const cube2DViewPorts = [
    new Rectangle(), new Rectangle(), new Rectangle(),
    new Rectangle(), new Rectangle(), new Rectangle()
];
const cubeUps = [
    new Vector3(0, 1, 0), new Vector3(0, 1, 0), new Vector3(0, 1, 0),
    new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(0, 0, -1)
];
const cubeDirections = [
    new Vector3(1, 0, 0), new Vector3(-1, 0, 0), new Vector3(0, 0, 1),
    new Vector3(0, 0, -1), new Vector3(0, 1, 0), new Vector3(0, -1, 0)
];
