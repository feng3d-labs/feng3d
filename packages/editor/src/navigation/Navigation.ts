import { oav, AddComponentMenu, RegisterComponent, Component, Object3D, PointGeometry, HideFlags, serialization, MeshRenderer, PointMaterial, PointUniforms, Color4, Vector3, geometryUtils, Renderable, reactive, transformLogic } from 'feng3d';
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

    private _navobject: Object3D;
    private _recastnavigation: Recastnavigation;
    private _allowedVoxelsPointGeometry: PointGeometry;
    private _rejectivedVoxelsPointGeometry: PointGeometry;
    private _debugVoxelsPointGeometry: PointGeometry;

    init()
    {
        super.init();
        this.hideFlags = this.hideFlags | HideFlags.DontSaveInBuild;

        this._navobject = serialization.setValue(new Object3D(), { name: 'NavObject', hideFlags: HideFlags.DontSave });
        {
            const pointsObject = new Object3D();
            pointsObject.name = 'allowedVoxels';
            const meshRenderer = pointsObject.addComponent(MeshRenderer);
            const material = meshRenderer.material = new PointMaterial();
            const uniforms = material.uniforms as PointUniforms;
            reactive(uniforms).u_color = new Color4(0, 1, 0);
            meshRenderer.geometry = this._allowedVoxelsPointGeometry = new PointGeometry();
            this._navobject.addChild(pointsObject);
        }
        {
            const pointsObject = new Object3D();
            pointsObject.name = 'rejectivedVoxels';
            const meshRenderer = pointsObject.addComponent(MeshRenderer);
            const material = meshRenderer.material = new PointMaterial();
            const uniforms = material.uniforms as PointUniforms;
            reactive(uniforms).u_color = new Color4(1, 0, 0);
            meshRenderer.geometry = this._rejectivedVoxelsPointGeometry = new PointGeometry();
            this._navobject.addChild(pointsObject);
        }
        {
            const pointsObject = new Object3D();
            pointsObject.name = 'debugVoxels';
            const meshRenderer = pointsObject.addComponent(MeshRenderer);
            const material = meshRenderer.material = new PointMaterial();
            const uniforms = material.uniforms as PointUniforms;
            reactive(uniforms).u_color = new Color4(0, 0, 1);
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
        const geometrys = this._getNavGeometrys(this.object3D.scene.object3D);
        if (geometrys.length === 0)
        {
            this._navobject && this._navobject.remove();

            return;
        }
        this.object3D.scene.object3D.addChild(this._navobject);
        {
            const rp = reactive(this._navobject.transform.position);
            rp.x = 0; rp.y = 0; rp.z = 0;
        }

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
     * @param object3D
     * @param geometrys
     */
    private _getNavGeometrys(object3D: Object3D, geometrys?: { positions: number[], indices: number[] }[])
    {
        geometrys = geometrys || [];

        if (!object3D.activeSelf)
        { return geometrys; }
        const model = object3D.getComponent(Renderable);
        const geometry = model && model.geometry;
        if (geometry)
        {
            const matrix = transformLogic(object3D.transform).local2world.value;
            const positions = [...geometry.positions];
            matrix.transformPoints(positions, positions);
            const indices = [...geometry.indices];
            //
            geometrys.push({ positions, indices });
        }
        object3D.children.forEach((element) =>
        {
            this._getNavGeometrys(element, geometrys);
        });

        return geometrys;
    }
}
