import { Light, createLight } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic } from "@feng3d/reactivity";
import { Box3, Matrix4x4, Vector3 } from '@feng3d/math';
import type { Camera } from '../cameras/Camera';
import type { Renderable } from '../core/Renderable';
import type { Scene } from '../scene/Scene';
import { Texture2D } from '../textures/Texture2D';
import { LightLogic } from './Light';

import './DirectionalLight';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        DirectionalLight: DirectionalLight;
    }
}

/**
 * DirectionalLight（纯数据接口）。
 */
export interface DirectionalLight extends Light
{
    readonly __type__: 'DirectionalLight';
    readonly lightType: any;
}

/**
 * 创建 DirectionalLight 实例。
 */
export function createDirectionalLight(): DirectionalLight
{
    return {
        ...createLight(), __type__: 'DirectionalLight',
        lightType: LightType.Directional,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        DirectionalLight: DirectionalLightLogic;
    }
}

/**
 * DirectionalLight 逻辑处理类。
 *
 * 继承 LightLogic，额外提供：
 * - shadowDepthTexture：方向光阴影深度纹理（depth24plus，depth-only Pass 写入 + 主 Pass 采样）
 * - updateShadowByCamera：根据场景包围盒算出阴影 viewProjection 矩阵（直接拼矩阵，不再经过 Camera/lens）
 * - debugShadowTexture：返回 shadowDepthTexture 供 debug 平面材质使用
 */
export class DirectionalLightLogic extends LightLogic
{
    /**
     * 方向光阴影深度纹理（depth24plus）。
     *
     * 既作为阴影 Pass 的 depthStencilAttachment（深度由光栅化写入），
     * 又作为主渲染 Pass 的采样纹理（片元着色器用 texture_depth_2d +
     * sampler_comparison 比较采样，硬件 PCF）。
     * 替代旧的 rgba8unorm + packDepthToRGBA 编码方案。
     */
    private _shadowDepthTexture: Texture2D | null = null;

    constructor(light: DirectionalLight)
    {
        super(light);
    }

    /** 方向光阴影深度纹理，懒创建（尺寸 1024×1024 depth24plus） */
    get shadowDepthTexture(): Texture2D
    {
        if (!this._shadowDepthTexture)
        {
            const size = this.shadowMapSize;
            this._shadowDepthTexture = new Texture2D();
            this._shadowDepthTexture.descriptor = {
                label: 'DirectionalLightShadowDepth',
                size: [size.x, size.y],
                format: 'depth24plus',
            };
        }

        return this._shadowDepthTexture;
    }

    /** 调试阴影图：方向光用 depth 纹理 */
    get debugShadowTexture(): Texture2D | null
    {
        return this.shadowDepthTexture;
    }

    /**
     * 根据场景投射阴影物体的包围盒，算出阴影 viewProjection 矩阵。
     *
     * 直接拼矩阵（view = lookAt 的逆；projection = setOrtho），不再经过 Camera 组件 + OrthographicLens。
     * 结果写入 `_shadowViewProjection`，ShadowRenderer 与 ForwardRenderer 读取。
     */
    updateShadowByCamera(scene: Scene, viewCamera: Camera, models: Renderable[]): void
    {
        const light = this.component as DirectionalLight;

        // 1. 计算所有可投影物体的世界包围盒
        const worldBounds: Box3 = models.reduce((pre: Box3, i) =>
        {
            const box = getLogic(getLogic(i).entity).boundingBox.value.worldBounds;
            if (!pre)
            {
                return box.clone();
            }
            pre.union(box);

            return pre;
        }, null) || new Box3(new Vector3(), new Vector3(1, 1, 1));

        // ── 方向光阴影相机定位原理 ──────────────────────────────────────
        // 方向光只有「方向」有意义，位置对阴影计算无意义。因此：
        //   - 朝向：完全由光源方向决定（相机沿光源方向看）。
        //   - 位置：完全由包围盒决定——放在包围盒「后方」（沿光源反方向）一点，
        //           使整个包围盒落入 [near, far] 之间。
        // 约定：lookAt 使 +Z 指向 target，因此相机「前方」物体在光源空间 z>0。
        // 算法：
        //   a. 用光源方向建立纯旋转矩阵 R（lookAt 的轴向，位置置零）。
        //   b. 用 R^-1 把世界包围盒 8 角点变换到「光源方向对齐空间」，得到该空间包围盒 lsMin/lsMax。
        //   c. 相机要「看向」整个包围盒，应位于 z 最小端之前（沿 -Z，即光源反方向）：
        //      lsCamZ = lsMin.z - margin。近平面 = margin，远平面 = (lsMax.z - lsMin.z) + margin。
        //   d. 把光源空间相机位置 (lsCenterX, lsCenterY, lsCamZ) 变回世界坐标作为最终相机位置。
        // ──────────────────────────────────────────────────────────────

        const lightDir = this.direction;
        // 方向接近垂直时 cross(Y, zAxis) 退化，改用 Z 轴作为备用 up
        const upAxis = Math.abs(lightDir.y) > 0.99 ? Vector3.Z_AXIS : Vector3.Y_AXIS;

        // a. 用 lookAt 建立纯旋转矩阵 R：位置取原点，target 取 lightDir，
        //    使 R 的 +Z 轴 = 光源方向（lookAt 约定：+Z 指向 target）。
        const orient = new Matrix4x4();
        orient.lookAt(lightDir, upAxis); // position=origin(默认), target=lightDir → zAxis=lightDir
        const R = orient.clone();
        // 把位置列清零，得到纯旋转矩阵 R（把光源空间向量映到世界空间）
        R.elements[12] = 0; R.elements[13] = 0; R.elements[14] = 0; R.elements[15] = 1;
        // R^-1 把世界空间点映到「光源方向对齐空间」
        const Rinv = R.clone().invert();

        // b. 世界包围盒 8 角点 → 光源方向对齐空间，求 lsMin/lsMax
        const { min: wbMin, max: wbMax } = worldBounds;
        const lsMin = new Vector3(Infinity, Infinity, Infinity);
        const lsMax = new Vector3(-Infinity, -Infinity, -Infinity);
        const tmp = new Vector3();
        for (let i = 0; i < 8; i++)
        {
            tmp.set(
                (i & 1) ? wbMax.x : wbMin.x,
                (i & 2) ? wbMax.y : wbMin.y,
                (i & 4) ? wbMax.z : wbMin.z
            );
            Rinv.transformPoint3(tmp, tmp);
            if (tmp.x < lsMin.x) lsMin.x = tmp.x;
            if (tmp.y < lsMin.y) lsMin.y = tmp.y;
            if (tmp.z < lsMin.z) lsMin.z = tmp.z;
            if (tmp.x > lsMax.x) lsMax.x = tmp.x;
            if (tmp.y > lsMax.y) lsMax.y = tmp.y;
            if (tmp.z > lsMax.z) lsMax.z = tmp.z;
        }

        // c. 光源空间相机位置与投影参数
        //    lookAt 使 +Z 指向 target，相机看向 +Z；前方物体 z∈[lsMin.z, lsMax.z]。
        //    相机放在 lsMin.z 之前（光源反方向）MARGIN，使整个包围盒落在相机前方 [near, far]。
        //    x/y 取包围盒中心居中投影，view space（相机本地）边界 = lsMin/lsMax 减去相机 xy。
        const MARGIN = 0.5;
        const lsCenterX = (lsMin.x + lsMax.x) / 2;
        const lsCenterY = (lsMin.y + lsMax.y) / 2;
        const lsCamZ = lsMin.z - MARGIN;
        // view space 正交边界：把包围盒相对相机居中后，严丝合缝映射到 [-1,1]
        const viewLeft = lsMin.x - lsCenterX;
        const viewRight = lsMax.x - lsCenterX;
        const viewBottom = lsMin.y - lsCenterY;
        const viewTop = lsMax.y - lsCenterY;
        const finalNear = MARGIN;
        const finalFar = (lsMax.z - lsMin.z) + MARGIN;

        // d. 光源空间相机位置 → 世界空间
        const lsPos = new Vector3(lsCenterX, lsCenterY, lsCamZ);
        const worldCamPos = R.transformPoint3(lsPos);

        // e. 直接拼 viewProjection 矩阵（不再经过 Camera/lens）：
        //    view 矩阵 = lookAt(worldCamPos, worldCamPos + lightDir) 的逆（camera→world 的逆 = world→camera）。
        //    注意 Matrix4x4.lookAt 保留已有 position/scale，需先用单位矩阵 + setPosition 设位置再 lookAt。
        const viewMatrix = new Matrix4x4();
        viewMatrix.setPosition(worldCamPos);
        viewMatrix.lookAt(worldCamPos.addTo(lightDir), upAxis);
        viewMatrix.invert();

        // f. 正交投影矩阵（OpenGL 风格 z∈[-1,1]，与原 OrthographicLens.setOrtho 一致）
        const projection = new Matrix4x4();
        projection.setOrtho(viewLeft, viewRight, viewTop, viewBottom, finalNear, finalFar);

        // VP = projection × view（append 是左乘：this = lhs × this）
        this._shadowViewProjection = projection.append(viewMatrix);
        this._shadowNear = finalNear;
        this._shadowFar = finalFar;
    }
}
// 注册到 componentLogic 分发表
registerLogic('DirectionalLight', DirectionalLightLogic);
