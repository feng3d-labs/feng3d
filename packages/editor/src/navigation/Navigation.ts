import { oav, AddComponentMenu, RegisterComponent, Component, GameObject, PointGeometry, HideFlags, serialization, MeshRenderer, Material, PointUniforms, Color4, RenderMode, Vector3, geometryUtils, Renderable } from 'feng3d';
import { Recastnavigation, VoxelFlag } from '../recastnavigation/Recastnavigation';

declare global
{
    export interface MixinsComponentMap { Navigation: Navigation; }
}

/**
 * 导航代理
 */
export class NavigationAgent
{
    /**
     * 距离边缘半径
     */
    @oav()
    radius = 0.5;

    /**
     * 允许行走高度
     */
    @oav()
    height = 2;

    /**
     * 允许爬上的阶梯高度
     */
    @oav()
    stepHeight = 0.4;

    /**
     * 允许行走坡度
     */
    @oav()
    maxSlope = 45;// [0,60]
}

/**
 * 导航组件，提供生成导航网格功能
 */
@AddComponentMenu('Navigation/Navigation')
@RegisterComponent()
export class Navigation extends Component
{
    @oav({ component: 'OAVObjectView' })
    agent = new NavigationAgent();

    private _navobject: GameObject;
    private _recastnavigation: Recastnavigation;
    private _allowedVoxelsPointGeometry: PointGeometry;
    private _rejectivedVoxelsPointGeometry: PointGeometry;
    private _debugVoxelsPointGeometry: PointGeometry;

    init()
    {
        super.init();
        this.hideFlags = this.hideFlags | HideFlags.DontSaveInBuild;

        this._navobject = serialization.setValue(new GameObject(), { name: 'NavObject', hideFlags: HideFlags.DontSave });
        {
            const pointsObject = new GameObject();
            pointsObject.name = 'allowedVoxels';
            const meshRenderer = pointsObject.addComponent(MeshRenderer);
            const material = meshRenderer.material = new Material();
            material.shaderName = 'point';
            const uniforms = material.uniforms as PointUniforms;
            uniforms.u_color = new Color4(0, 1, 0);
            uniforms.u_PointSize = 2;
            material.renderParams.renderMode = RenderMode.POINTS;
            meshRenderer.geometry = this._allowedVoxelsPointGeometry = new PointGeometry();
            this._navobject.addChild(pointsObject);
        }
        {
            const pointsObject = new GameObject();
            pointsObject.name = 'rejectivedVoxels';
            const meshRenderer = pointsObject.addComponent(MeshRenderer);
            const material = meshRenderer.material = new Material();
            material.shaderName = 'point';
            const uniforms = material.uniforms as PointUniforms;
            uniforms.u_color = new Color4(1, 0, 0);
            uniforms.u_PointSize = 2;
            material.renderParams.renderMode = RenderMode.POINTS;
            meshRenderer.geometry = this._rejectivedVoxelsPointGeometry = new PointGeometry();
            this._navobject.addChild(pointsObject);
        }
        {
            const pointsObject = new GameObject();
            pointsObject.name = 'debugVoxels';
            const meshRenderer = pointsObject.addComponent(MeshRenderer);
            const material = meshRenderer.material = new Material();
            material.shaderName = 'point';
            const uniforms = material.uniforms as PointUniforms;
            uniforms.u_color = new Color4(0, 0, 1);
            uniforms.u_PointSize = 2;
            material.renderParams.renderMode = RenderMode.POINTS;
            meshRenderer.geometry = this._debugVoxelsPointGeometry = new PointGeometry();
            this._navobject.addChild(pointsObject);
        }
    }

    /**
     * 清楚oav网格模型
     */
    @oav()
    clear()
    {
        this._navobject && this._navobject.remove();
    }

    /**
     * 计算导航网格数据
     */
    @oav()
    bake()
    {
        const geometrys = this._getNavGeometrys(this.gameObject.scene.gameObject);
        if (geometrys.length === 0)
        {
            this._navobject && this._navobject.remove();

            return;
        }
        this.gameObject.scene.gameObject.addChild(this._navobject);
        this._navobject.transform.position = new Vector3();

        const geometry = geometryUtils.mergeGeometry(geometrys);

        this._recastnavigation = this._recastnavigation || new Recastnavigation();

        this._recastnavigation.doRecastnavigation(geometry, this.agent);
        const voxels = this._recastnavigation.getVoxels();

        const voxels0 = voxels.filter((v) => v.flag === VoxelFlag.Default);
        const voxels1 = voxels.filter((v) => v.flag !== VoxelFlag.Default);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const voxels2 = voxels.filter((v) => !!(v.flag & VoxelFlag.IsContour));

        this._allowedVoxelsPointGeometry.points = voxels0.map((v) => ({ position: new Vector3(v.x, v.y, v.z) }));
        this._rejectivedVoxelsPointGeometry.points = voxels1.map((v) => ({ position: new Vector3(v.x, v.y, v.z) }));
        // this._debugVoxelsPointGeometry.points = voxels2.map(v => { return { position: new Vector3(v.x, v.y, v.z) } });
    }

    /**
     * 获取参与导航的几何体列表
     * @param gameobject
     * @param geometrys
     */
    private _getNavGeometrys(gameobject: GameObject, geometrys?: { positions: number[], indices: number[] }[])
    {
        geometrys = geometrys || [];

        if (!gameobject.activeSelf)
        { return geometrys; }
        const model = gameobject.getComponent(Renderable);
        const geometry = model && model.geometry;
        if (geometry)
        {
            const matrix = gameobject.transform.localToWorldMatrix;
            // eslint-disable-next-line prefer-spread
            const positions = Array.apply(null, geometry.positions);
            matrix.transformPoints(positions, positions);
            // eslint-disable-next-line prefer-spread
            const indices = Array.apply(null, geometry.indices);
            //
            geometrys.push({ positions, indices });
        }
        gameobject.children.forEach((element) =>
        {
            this._getNavGeometrys(element, geometrys);
        });

        return geometrys;
    }
}
