import { Color4, Component, CullFace, CustomGeometry, GameObject, Geometry, Material, mathUtil, RegisterComponent, Renderable, RenderMode, Segment, SegmentGeometry, serialization, TorusGeometry, Vector3, watcher } from 'feng3d';

declare global
{
    export interface MixinsComponentMap { RToolModel: RToolModel }
    export interface MixinsComponentMap
    {
        SectorGameObject: SectorGameObject
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
        this.gameObject.name = 'GameObjectRotationModel';
        this.initModels();
    }

    private initModels()
    {
        this.xAxis = serialization.setValue(new GameObject(), { name: 'xAxis' }).addComponent(CoordinateRotationAxis);
        this.xAxis.color.setTo(1, 0, 0, 1);
        this.xAxis.update();
        this.xAxis.transform.ry = 90;
        this.gameObject.addChild(this.xAxis.gameObject);

        this.yAxis = serialization.setValue(new GameObject(), { name: 'yAxis' }).addComponent(CoordinateRotationAxis);
        this.yAxis.color.setTo(0, 1, 0);
        this.yAxis.update();
        this.yAxis.transform.rx = 90;
        this.gameObject.addChild(this.yAxis.gameObject);

        this.zAxis = serialization.setValue(new GameObject(), { name: 'zAxis' }).addComponent(CoordinateRotationAxis);
        this.zAxis.color.setTo(0, 0, 1);
        this.zAxis.update();
        this.gameObject.addChild(this.zAxis.gameObject);

        this.cameraAxis = serialization.setValue(new GameObject(), { name: 'cameraAxis' }).addComponent(CoordinateRotationAxis);
        this.cameraAxis.radius = 88;
        this.cameraAxis.color.setTo(1, 1, 1);
        this.cameraAxis.update();
        this.gameObject.addChild(this.cameraAxis.gameObject);

        this.freeAxis = serialization.setValue(new GameObject(), { name: 'freeAxis' }).addComponent(CoordinateRotationFreeAxis);
        this.freeAxis.color.setTo(1, 1, 1);
        this.freeAxis.update();
        this.gameObject.addChild(this.freeAxis.gameObject);
    }
}

@RegisterComponent()
export class CoordinateRotationAxis extends Component
{
    private isinit: boolean;
    private segmentGeometry: SegmentGeometry;
    private torusGeometry: TorusGeometry;
    private sector: SectorGameObject;

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
        const border = new GameObject();
        let model = border.addComponent(Renderable);
        const material = model.material = serialization.setValue(new Material(), {
            shaderName: 'segment', renderParams: { renderMode: RenderMode.LINES },
            uniforms: { u_segmentColor: new Color4(1, 1, 1, 0.99) },
        });
        material.renderParams.enableBlend = true;
        this.segmentGeometry = model.geometry = new SegmentGeometry();
        this.gameObject.addChild(border);
        this.sector = serialization.setValue(new GameObject(), { name: 'sector' }).addComponent(SectorGameObject);

        const mouseHit = serialization.setValue(new GameObject(), { name: 'hit' });
        model = mouseHit.addComponent(Renderable);
        this.torusGeometry = model.geometry = serialization.setValue(new TorusGeometry(), { radius: this.radius, tubeRadius: 2 });
        model.material = new Material();
        mouseHit.transform.rx = 90;
        mouseHit.activeSelf = false;
        mouseHit.mouseEnabled = true;
        this.gameObject.addChild(mouseHit);

        this.isinit = true;
        this.update();
    }

    update()
    {
        if (!this.isinit) return;

        this.sector.radius = this.radius;
        this.torusGeometry.radius = this.radius;
        const color = this.selected ? this.selectedColor : this.color;

        const inverseGlobalMatrix = this.transform.worldToLocalMatrix;
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
        const inverseGlobalMatrix = this.transform.worldToLocalMatrix;
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
        this.gameObject.addChild(this.sector.gameObject);
    }

    hideSector()
    {
        if (this.sector.gameObject.parent)
        { this.sector.gameObject.parent.removeChild(this.sector.gameObject); }
    }
}

/**
 * 扇形对象
 */
@RegisterComponent()
export class SectorGameObject extends Component
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
        this.gameObject.name = 'sector';

        let model = this.gameObject.addComponent(Renderable);
        this.geometry = model.geometry = new CustomGeometry();
        model.material = serialization.setValue(new Material(), { shaderName: 'color', uniforms: { u_diffuseInput: new Color4(0.5, 0.5, 0.5, 0.2) } });
        model.material.renderParams.enableBlend = true;
        model.material.renderParams.cullFace = CullFace.NONE;

        const border = serialization.setValue(new GameObject(), { name: 'border' });
        model = border.addComponent(Renderable);
        const material = model.material = serialization.setValue(new Material(), {
            shaderName: 'segment', renderParams: { renderMode: RenderMode.LINES },
            uniforms: { u_segmentColor: new Color4(1, 1, 1, 0.99) },
        });
        material.renderParams.enableBlend = true;
        this.segmentGeometry = model.geometry = new SegmentGeometry();
        this.gameObject.addChild(border);

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
    private sector: SectorGameObject;

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
        const border = serialization.setValue(new GameObject(), { name: 'border' });
        const model = border.addComponent(Renderable);
        const material = model.material = serialization.setValue(new Material(), {
            shaderName: 'segment', renderParams: { renderMode: RenderMode.LINES },
            uniforms: { u_segmentColor: new Color4(1, 1, 1, 0.99) }
        });
        material.renderParams.enableBlend = true;
        this.segmentGeometry = model.geometry = new SegmentGeometry();
        this.gameObject.addChild(border);

        this.sector = serialization.setValue(new GameObject(), { name: 'sector' }).addComponent(SectorGameObject);
        this.sector.update(0, 360);
        this.sector.gameObject.activeSelf = false;
        this.sector.gameObject.mouseEnabled = true;
        this.gameObject.addChild(this.sector.gameObject);

        this.isinit = true;
        this.update();
    }

    update()
    {
        if (!this.isinit) return;

        this.sector.radius = this.radius;
        const color = this.selected ? this.selectedColor : this.color;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const inverseGlobalMatrix = this.transform.worldToLocalMatrix;

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
