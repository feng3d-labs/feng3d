import { Color4, Component, CustomGeometry, Object3D, Geometry, ColorMaterial, SegmentMaterial, mathUtil, RegisterComponent, Renderable, Segment, SegmentGeometry, serialization, TorusGeometry, Vector3, reactive, logic, watcher } from 'feng3d';
import { setBlendEnabled, setCullFace } from '../../../utils/materialRenderState';

declare global
{
    export interface MixinsComponentMap { RToolModel: RToolModel }
    export interface MixinsComponentMap
    {
        SectorObject3D: SectorObject3D
    }
    export interface MixinsComponentMap
    {
        CoordinateRotationFreeAxis: CoordinateRotationFreeAxis
    }
    export interface MixinsComponentMap
    {
        CoordinateRotationAxis: CoordinateRotationAxis
    }
}

/**
 * 旋转工具模型组件
 */
@RegisterComponent()
export class RToolModel extends Component
{
    xAxis: CoordinateRotationAxis;
    yAxis: CoordinateRotationAxis;
    zAxis: CoordinateRotationAxis;
    freeAxis: CoordinateRotationFreeAxis;
    cameraAxis: CoordinateRotationAxis;

    init()
    {
        super.init();
        this.object3D.name = 'Object3DRotationModel';
        this.initModels();
    }

    private initModels()
    {
        this.xAxis = serialization.setValue(new Object3D(), { name: 'xAxis' }).addComponent(CoordinateRotationAxis);
        this.xAxis.color.setTo(1, 0, 0, 1);
        this.xAxis.update();
        { const r = reactive(this.xAxis.transform.rotation); r.y = 90; }
        this.object3D.addChild(this.xAxis.object3D);

        this.yAxis = serialization.setValue(new Object3D(), { name: 'yAxis' }).addComponent(CoordinateRotationAxis);
        this.yAxis.color.setTo(0, 1, 0);
        this.yAxis.update();
        { const r = reactive(this.yAxis.transform.rotation); r.x = 90; }
        this.object3D.addChild(this.yAxis.object3D);

        this.zAxis = serialization.setValue(new Object3D(), { name: 'zAxis' }).addComponent(CoordinateRotationAxis);
        this.zAxis.color.setTo(0, 0, 1);
        this.zAxis.update();
        this.object3D.addChild(this.zAxis.object3D);

        this.cameraAxis = serialization.setValue(new Object3D(), { name: 'cameraAxis' }).addComponent(CoordinateRotationAxis);
        this.cameraAxis.radius = 88;
        this.cameraAxis.color.setTo(1, 1, 1);
        this.cameraAxis.update();
        this.object3D.addChild(this.cameraAxis.object3D);

        this.freeAxis = serialization.setValue(new Object3D(), { name: 'freeAxis' }).addComponent(CoordinateRotationFreeAxis);
        this.freeAxis.color.setTo(1, 1, 1);
        this.freeAxis.update();
        this.object3D.addChild(this.freeAxis.object3D);
    }
}

@RegisterComponent()
export class CoordinateRotationAxis extends Component
{
    private isinit: boolean;
    private segmentGeometry: SegmentGeometry;
    private torusGeometry: TorusGeometry;
    private sector: SectorObject3D;

    radius = 80;
    readonly color = new Color4(1, 0, 0, 0.99);
    private backColor = new Color4(0.6, 0.6, 0.6, 0.99);
    private selectedColor = new Color4(1, 1, 0, 0.99);

    //
    selected = false;

    /**
     * 过滤法线显示某一面线条
     */
    filterNormal: Vector3;

    init()
    {
        super.init();

        watcher.watch(this as CoordinateRotationAxis, 'selected', this.update, this);
        watcher.watch(this as CoordinateRotationAxis, 'filterNormal', this.update, this);

        this.initModels();
    }

    private initModels()
    {
        const border = new Object3D();
        let model = border.addComponent(Renderable);
        const material = model.material = new SegmentMaterial();
        reactive(material.uniforms).u_segmentColor = new Color4(1, 1, 1, 0.99);
        setBlendEnabled(material, true);
        this.segmentGeometry = model.geometry = new SegmentGeometry();
        this.object3D.addChild(border);
        this.sector = serialization.setValue(new Object3D(), { name: 'sector' }).addComponent(SectorObject3D);

        const mouseHit = serialization.setValue(new Object3D(), { name: 'hit' });
        model = mouseHit.addComponent(Renderable);
        this.torusGeometry = model.geometry = serialization.setValue(new TorusGeometry(), { radius: this.radius, tubeRadius: 2 });
        model.material = new ColorMaterial();
        { const r = reactive(mouseHit.transform.rotation); r.x = 90; }
        mouseHit.activeSelf = false;
        mouseHit.mouseEnabled = true;
        this.object3D.addChild(mouseHit);

        this.isinit = true;
        this.update();
    }

    update()
    {
        if (!this.isinit) return;

        this.sector.radius = this.radius;
        this.torusGeometry.radius = this.radius;
        const color = this.selected ? this.selectedColor : this.color;

        const inverseGlobalMatrix = logic(this.transform).world2local.value;
        let localNormal: Vector3;
        if (this.filterNormal)
        {
            localNormal = inverseGlobalMatrix.transformVector3(this.filterNormal);
        }

        this.segmentGeometry.segments = [];
        const points: Vector3[] = [];
        for (let i = 0; i <= 360; i++)
        {
            points[i] = new Vector3(Math.sin(i * mathUtil.DEG2RAD), Math.cos(i * mathUtil.DEG2RAD), 0);
            points[i].scaleNumber(this.radius);
            if (i > 0)
            {
                let show = true;
                if (localNormal)
                {
                    show = points[i - 1].dot(localNormal) > 0 && points[i].dot(localNormal) > 0;
                }
                if (show)
                {
                    this.segmentGeometry.segments.push({ start: points[i - 1], end: points[i], startColor: color, endColor: color });
                }
                else if (this.selected)
                {
                    this.segmentGeometry.segments.push({ start: points[i - 1], end: points[i], startColor: this.backColor, endColor: this.backColor });
                }
            }
        }
    }

    showSector(startPos: Vector3, endPos: Vector3)
    {
        const inverseGlobalMatrix = logic(this.transform).world2local.value;
        const localStartPos = inverseGlobalMatrix.transformPoint3(startPos);
        const localEndPos = inverseGlobalMatrix.transformPoint3(endPos);
        const startAngle = Math.atan2(localStartPos.y, localStartPos.x) * mathUtil.RAD2DEG;
        const endAngle = Math.atan2(localEndPos.y, localEndPos.x) * mathUtil.RAD2DEG;

        //
        let min = Math.min(startAngle, endAngle);
        const max = Math.max(startAngle, endAngle);
        if (max - min > 180)
        {
            min += 360;
        }
        this.sector.update(min, max);
        this.object3D.addChild(this.sector.object3D);
    }

    hideSector()
    {
        if (this.sector.object3D.parent)
        { this.sector.object3D.parent.removeChild(this.sector.object3D); }
    }
}

/**
 * 扇形对象
 */
@RegisterComponent()
export class SectorObject3D extends Component
{
    private isinit: boolean;
    private segmentGeometry: SegmentGeometry;
    private geometry: Geometry;
    private borderColor = new Color4(0, 1, 1, 0.6);

    radius = 80;

    private _start = 0;
    private _end = 0;

    /**
     * 构建3D对象
     */
    init()
    {
        super.init();
        this.object3D.name = 'sector';

        let model = this.object3D.addComponent(Renderable);
        this.geometry = model.geometry = new CustomGeometry();
        const sectorMaterial = model.material = new ColorMaterial();
        reactive(sectorMaterial.uniforms).u_diffuseInput = new Color4(0.5, 0.5, 0.5, 0.2);
        setBlendEnabled(model.material, true);
        setCullFace(model.material, 'none');

        const border = serialization.setValue(new Object3D(), { name: 'border' });
        model = border.addComponent(Renderable);
        const material = model.material = new SegmentMaterial();
        reactive(material.uniforms).u_segmentColor = new Color4(1, 1, 1, 0.99);
        setBlendEnabled(material, true);
        this.segmentGeometry = model.geometry = new SegmentGeometry();
        this.object3D.addChild(border);

        this.isinit = true;
        this.update(0, 0);
    }

    update(start = 0, end = 0)
    {
        if (!this.isinit) return;

        this._start = Math.min(start, end);
        this._end = Math.max(start, end);
        let length = Math.floor(this._end - this._start);
        if (length === 0)
        {
            length = 1;
        }
        const vertexPositionData = [];
        let indices = [];
        vertexPositionData[0] = 0;
        vertexPositionData[1] = 0;
        vertexPositionData[2] = 0;
        for (let i = 0; i < length; i++)
        {
            vertexPositionData[i * 3 + 3] = this.radius * Math.cos((i + this._start) * mathUtil.DEG2RAD);
            vertexPositionData[i * 3 + 4] = this.radius * Math.sin((i + this._start) * mathUtil.DEG2RAD);
            vertexPositionData[i * 3 + 5] = 0;
            if (i > 0)
            {
                indices[(i - 1) * 3] = 0;
                indices[(i - 1) * 3 + 1] = i;
                indices[(i - 1) * 3 + 2] = i + 1;
            }
        }
        if (indices.length === 0) indices = [0, 0, 0];
        this.geometry.positions = vertexPositionData;
        this.geometry.indices = indices;
        // 绘制边界
        const startPoint = new Vector3(this.radius * Math.cos((this._start - 0.1) * mathUtil.DEG2RAD), this.radius * Math.sin((this._start - 0.1) * mathUtil.DEG2RAD), 0);
        const endPoint = new Vector3(this.radius * Math.cos((this._end + 0.1) * mathUtil.DEG2RAD), this.radius * Math.sin((this._end + 0.1) * mathUtil.DEG2RAD), 0);
        //
        this.segmentGeometry.segments = [
            { start: new Vector3(), end: startPoint, startColor: this.borderColor, endColor: this.borderColor },
            { start: new Vector3(), end: endPoint, startColor: this.borderColor, endColor: this.borderColor },
        ];
    }
}

@RegisterComponent()
export class CoordinateRotationFreeAxis extends Component
{
    private isinit: boolean;
    private segmentGeometry: SegmentGeometry;
    private sector: SectorObject3D;

    private radius = 80;
    color = new Color4(1, 0, 0, 0.99);
    private backColor = new Color4(0.6, 0.6, 0.6, 0.99);
    private selectedColor = new Color4(1, 1, 0, 0.99);

    //
    selected = false;

    init()
    {
        super.init();
        watcher.watch(this as CoordinateRotationFreeAxis, 'selected', this.update, this);
        this.initModels();
    }

    private initModels()
    {
        const border = serialization.setValue(new Object3D(), { name: 'border' });
        const model = border.addComponent(Renderable);
        const material = model.material = new SegmentMaterial();
        reactive(material.uniforms).u_segmentColor = new Color4(1, 1, 1, 0.99);
        setBlendEnabled(material, true);
        this.segmentGeometry = model.geometry = new SegmentGeometry();
        this.object3D.addChild(border);

        this.sector = serialization.setValue(new Object3D(), { name: 'sector' }).addComponent(SectorObject3D);
        this.sector.update(0, 360);
        this.sector.object3D.activeSelf = false;
        this.sector.object3D.mouseEnabled = true;
        this.object3D.addChild(this.sector.object3D);

        this.isinit = true;
        this.update();
    }

    update()
    {
        if (!this.isinit) return;

        this.sector.radius = this.radius;
        const color = this.selected ? this.selectedColor : this.color;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const inverseGlobalMatrix = logic(this.transform).world2local.value;

        const segments: Segment[] = [];
        const points: Vector3[] = [];
        for (let i = 0; i <= 360; i++)
        {
            points[i] = new Vector3(Math.sin(i * mathUtil.DEG2RAD), Math.cos(i * mathUtil.DEG2RAD), 0);
            points[i].scaleNumber(this.radius);
            if (i > 0)
            {
                segments.push({ start: points[i - 1], end: points[i], startColor: color, endColor: color });
            }
        }
        this.segmentGeometry.segments = segments;
    }
}
