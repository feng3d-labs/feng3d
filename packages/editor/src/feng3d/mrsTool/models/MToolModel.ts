import { Color4, Component, ConeGeometry, CubeGeometry, CylinderGeometry, Object3D, ColorMaterial, SegmentMaterial, PlaneGeometry, RegisterComponent, Renderable, SegmentGeometry, SegmentUniforms, serialization, Vector3, reactive, watcher } from 'feng3d';
import { setBlendEnabled, setCullFace } from '../../../utils/materialRenderState';

declare global
{
    export interface MixinsComponentMap
    {
        MToolModel: MToolModel
    }
    export interface MixinsComponentMap
    {
        CoordinateAxis: CoordinateAxis
    }
    export interface MixinsComponentMap
    {
        CoordinatePlane: CoordinatePlane
    }
}

/**
 * 移动工具模型组件
 */
@RegisterComponent()
export class MToolModel extends Component
{
    xAxis: CoordinateAxis;
    yAxis: CoordinateAxis;
    zAxis: CoordinateAxis;

    yzPlane: CoordinatePlane;
    xzPlane: CoordinatePlane;
    xyPlane: CoordinatePlane;

    oCube: CoordinateCube;

    init()
    {
        super.init();
        this.object3D.name = 'Object3DMoveModel';
        this.initModels();
    }

    private initModels()
    {
        this.xAxis = serialization.setValue(new Object3D(), { name: 'xAxis' }).addComponent(CoordinateAxis);
        this.xAxis.color.setTo(1, 0, 0, 1);
        { const r = reactive(this.xAxis.transform.rotation); r.z = -90; }
        this.object3D.addChild(this.xAxis.object3D);

        this.yAxis = serialization.setValue(new Object3D(), { name: 'yAxis' }).addComponent(CoordinateAxis);
        this.yAxis.color.setTo(0, 1, 0, 1);
        this.object3D.addChild(this.yAxis.object3D);

        this.zAxis = serialization.setValue(new Object3D(), { name: 'zAxis' }).addComponent(CoordinateAxis);
        this.zAxis.color.setTo(0, 0, 1, 1);
        { const r = reactive(this.zAxis.transform.rotation); r.x = 90; }
        this.object3D.addChild(this.zAxis.object3D);

        this.yzPlane = serialization.setValue(new Object3D(), { name: 'yzPlane' }).addComponent(CoordinatePlane);
        this.yzPlane.color.setTo(1, 0, 0, 0.2);
        this.yzPlane.selectedColor.setTo(1, 0, 0, 0.5);
        this.yzPlane.borderColor.setTo(1, 0, 0, 1);
        { const r = reactive(this.yzPlane.transform.rotation); r.z = 90; }
        this.object3D.addChild(this.yzPlane.object3D);

        this.xzPlane = serialization.setValue(new Object3D(), { name: 'xzPlane' }).addComponent(CoordinatePlane);
        this.xzPlane.color.setTo(0, 1, 0, 0.2);
        this.xzPlane.selectedColor.setTo(0, 1, 0, 0.5);
        this.xzPlane.borderColor.setTo(0, 1, 0, 1);
        this.object3D.addChild(this.xzPlane.object3D);

        this.xyPlane = serialization.setValue(new Object3D(), { name: 'xyPlane' }).addComponent(CoordinatePlane);
        this.xyPlane.color.setTo(0, 0, 1, 0.2);
        this.xyPlane.selectedColor.setTo(0, 0, 1, 0.5);
        this.xyPlane.borderColor.setTo(0, 0, 1, 1);
        { const r = reactive(this.xyPlane.transform.rotation); r.x = -90; }
        this.object3D.addChild(this.xyPlane.object3D);

        this.oCube = serialization.setValue(new Object3D(), { name: 'oCube' }).addComponent(CoordinateCube);
        this.object3D.addChild(this.oCube.object3D);
    }
}

@RegisterComponent()
export class CoordinateAxis extends Component
{
    private isinit: boolean;
    private segmentMaterial: SegmentMaterial;
    private material: ColorMaterial;

    private xArrow: Object3D;

    readonly color = new Color4(1, 0, 0, 0.99);
    private selectedColor = new Color4(1, 1, 0, 0.99);
    private length = 100;

    //
    selected = false;

    init()
    {
        super.init();

        watcher.watch(<CoordinateAxis> this, 'selected', this.update, this);

        const xLine = new Object3D();
        let model = xLine.addComponent(Renderable);
        const segmentGeometry = model.geometry = new SegmentGeometry();
        segmentGeometry.addSegment({ start: new Vector3(), end: new Vector3(0, this.length, 0) });
        this.segmentMaterial = model.material = new SegmentMaterial();
        this.object3D.addChild(xLine);
        //
        this.xArrow = new Object3D();
        model = this.xArrow.addComponent(Renderable);
        model.geometry = serialization.setValue(new ConeGeometry(), { bottomRadius: 5, height: 18 });
        this.material = model.material = new ColorMaterial();
        setBlendEnabled(this.material, true);
        { const r = reactive(this.xArrow.transform.position); r.y = this.length; }
        this.object3D.addChild(this.xArrow);

        const mouseHit = serialization.setValue(new Object3D(), { name: 'hitCoordinateAxis' });
        model = mouseHit.addComponent(Renderable);
        model.geometry = serialization.setValue(new CylinderGeometry(), { topRadius: 5, bottomRadius: 5, height: this.length });
        model.material = new ColorMaterial();
        { const r = reactive(mouseHit.transform.position); r.y = 20 + (this.length - 20) / 2; }
        mouseHit.activeSelf = false;
        mouseHit.mouseEnabled = true;
        this.object3D.addChild(mouseHit);

        this.isinit = true;
        this.update();
    }

    update()
    {
        if (!this.isinit) return;
        const color = this.selected ? this.selectedColor : this.color;
        (<SegmentUniforms> this.segmentMaterial.uniforms).u_segmentColor = color;
        //
        reactive(this.material.uniforms).u_diffuseInput = color;
    }
}

@RegisterComponent()
export class CoordinateCube extends Component
{
    private isinit = false;
    private colorMaterial: ColorMaterial;
    private oCube: Object3D;

    color = new Color4(1, 1, 1, 0.99);
    selectedColor = new Color4(1, 1, 0, 0.99);
    //
    selected = false;

    init()
    {
        super.init();

        watcher.watch(<CoordinateCube> this, 'selected', this.update, this);

        //
        this.oCube = new Object3D();
        const model = this.oCube.addComponent(Renderable);
        model.geometry = serialization.setValue(new CubeGeometry(), { width: 8, height: 8, depth: 8 });
        this.colorMaterial = model.material = new ColorMaterial();
        setBlendEnabled(this.colorMaterial, true);
        this.oCube.mouseEnabled = true;
        this.object3D.addChild(this.oCube);

        this.isinit = true;
        this.update();
    }

    update()
    {
        if (!this.isinit) return;
        reactive(this.colorMaterial.uniforms).u_diffuseInput = this.selected ? this.selectedColor : this.color;
    }
}

@RegisterComponent()
export class CoordinatePlane extends Component
{
    private isinit: boolean;
    private colorMaterial: ColorMaterial;
    private segmentGeometry: SegmentGeometry;

    color = new Color4(1, 0, 0, 0.2);
    borderColor = new Color4(1, 0, 0, 0.99);

    selectedColor = new Color4(1, 0, 0, 0.5);
    private selectedborderColor = new Color4(1, 1, 0, 0.99);

    //
    get width() { return this._width; }
    private _width = 20;
    //
    selected = false;

    init()
    {
        super.init();
        watcher.watch(<CoordinatePlane> this, 'selected', this.update, this);

        const plane = serialization.setValue(new Object3D(), { name: 'plane' });
        let model = plane.addComponent(Renderable);
        {
            const r = reactive(plane.transform.position);
            r.x = this._width / 2; r.z = this._width / 2;
        }
        model.geometry = serialization.setValue(new PlaneGeometry(), { width: this._width, height: this._width });
        this.colorMaterial = model.material = new ColorMaterial();
        setCullFace(this.colorMaterial, 'none');
        setBlendEnabled(this.colorMaterial, true);
        plane.mouseEnabled = true;
        this.object3D.addChild(plane);

        const border = serialization.setValue(new Object3D(), { name: 'border' });
        model = border.addComponent(Renderable);
        this.segmentGeometry = model.geometry = new SegmentGeometry();
        const segmentMaterial = model.material = new SegmentMaterial();
        reactive(segmentMaterial.uniforms).u_segmentColor = new Color4(1, 1, 1, 0.99);
        this.object3D.addChild(border);

        this.isinit = true;
        this.update();
    }

    update()
    {
        if (!this.isinit) return;

        reactive(this.colorMaterial.uniforms).u_diffuseInput = this.selected ? this.selectedColor : this.color;

        let color = this.selected ? this.selectedborderColor : this.borderColor;
        this.segmentGeometry.segments = [{ start: new Vector3(0, 0, 0), end: new Vector3(this._width, 0, 0), startColor: color, endColor: color }];

        color = this.selected ? this.selectedborderColor : this.borderColor;
        this.segmentGeometry.segments.push({ start: new Vector3(this._width, 0, 0), end: new Vector3(this._width, 0, this._width), startColor: color, endColor: color });

        color = this.selected ? this.selectedborderColor : this.borderColor;
        this.segmentGeometry.segments.push({ start: new Vector3(this._width, 0, this._width), end: new Vector3(0, 0, this._width), startColor: color, endColor: color });

        color = this.selected ? this.selectedborderColor : this.borderColor;
        this.segmentGeometry.segments.push({ start: new Vector3(0, 0, this._width), end: new Vector3(0, 0, 0), startColor: color, endColor: color });
    }
}
