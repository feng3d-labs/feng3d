import { Color4, ColorUniforms, Component, ConeGeometry, CubeGeometry, CullFace, CylinderGeometry, GameObject, Material, PlaneGeometry, RegisterComponent, Renderable, SegmentGeometry, SegmentUniforms, serialization, Vector3, watcher } from 'feng3d';

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
        this.gameObject.name = 'GameObjectMoveModel';
        this.initModels();
    }

    private initModels()
    {
        this.xAxis = serialization.setValue(new GameObject(), { name: 'xAxis' }).addComponent(CoordinateAxis);
        this.xAxis.color.setTo(1, 0, 0, 1);
        this.xAxis.transform.rz = -90;
        this.gameObject.addChild(this.xAxis.gameObject);

        this.yAxis = serialization.setValue(new GameObject(), { name: 'yAxis' }).addComponent(CoordinateAxis);
        this.yAxis.color.setTo(0, 1, 0, 1);
        this.gameObject.addChild(this.yAxis.gameObject);

        this.zAxis = serialization.setValue(new GameObject(), { name: 'zAxis' }).addComponent(CoordinateAxis);
        this.zAxis.color.setTo(0, 0, 1, 1);
        this.zAxis.transform.rx = 90;
        this.gameObject.addChild(this.zAxis.gameObject);

        this.yzPlane = serialization.setValue(new GameObject(), { name: 'yzPlane' }).addComponent(CoordinatePlane);
        this.yzPlane.color.setTo(1, 0, 0, 0.2);
        this.yzPlane.selectedColor.setTo(1, 0, 0, 0.5);
        this.yzPlane.borderColor.setTo(1, 0, 0, 1);
        this.yzPlane.transform.rz = 90;
        this.gameObject.addChild(this.yzPlane.gameObject);

        this.xzPlane = serialization.setValue(new GameObject(), { name: 'xzPlane' }).addComponent(CoordinatePlane);
        this.xzPlane.color.setTo(0, 1, 0, 0.2);
        this.xzPlane.selectedColor.setTo(0, 1, 0, 0.5);
        this.xzPlane.borderColor.setTo(0, 1, 0, 1);
        this.gameObject.addChild(this.xzPlane.gameObject);

        this.xyPlane = serialization.setValue(new GameObject(), { name: 'xyPlane' }).addComponent(CoordinatePlane);
        this.xyPlane.color.setTo(0, 0, 1, 0.2);
        this.xyPlane.selectedColor.setTo(0, 0, 1, 0.5);
        this.xyPlane.borderColor.setTo(0, 0, 1, 1);
        this.xyPlane.transform.rx = -90;
        this.gameObject.addChild(this.xyPlane.gameObject);

        this.oCube = serialization.setValue(new GameObject(), { name: 'oCube' }).addComponent(CoordinateCube);
        this.gameObject.addChild(this.oCube.gameObject);
    }
}

@RegisterComponent()
export class CoordinateAxis extends Component
{
    private isinit: boolean;
    private segmentMaterial: Material;
    private material: Material;

    private xArrow: GameObject;

    readonly color = new Color4(1, 0, 0, 0.99);
    private selectedColor = new Color4(1, 1, 0, 0.99);
    private length = 100;

    //
    selected = false;

    init()
    {
        super.init();

        watcher.watch(<CoordinateAxis> this, 'selected', this.update, this);

        const xLine = new GameObject();
        let model = xLine.addComponent(Renderable);
        const segmentGeometry = model.geometry = new SegmentGeometry();
        segmentGeometry.addSegment({ start: new Vector3(), end: new Vector3(0, this.length, 0) });
        this.segmentMaterial = model.material = Material.create('segment');
        this.gameObject.addChild(xLine);
        //
        this.xArrow = new GameObject();
        model = this.xArrow.addComponent(Renderable);
        model.geometry = serialization.setValue(new ConeGeometry(), { bottomRadius: 5, height: 18 });
        this.material = model.material = serialization.setValue(new Material(), { shaderName: 'color' });
        this.material.renderParams.enableBlend = true;
        this.xArrow.transform.y = this.length;
        this.gameObject.addChild(this.xArrow);

        const mouseHit = serialization.setValue(new GameObject(), { name: 'hitCoordinateAxis' });
        model = mouseHit.addComponent(Renderable);
        model.geometry = serialization.setValue(new CylinderGeometry(), { topRadius: 5, bottomRadius: 5, height: this.length });
        model.material = Material.create('color');
        mouseHit.transform.y = 20 + (this.length - 20) / 2;
        mouseHit.activeSelf = false;
        mouseHit.mouseEnabled = true;
        this.gameObject.addChild(mouseHit);

        this.isinit = true;
        this.update();
    }

    update()
    {
        if (!this.isinit) return;
        const color = this.selected ? this.selectedColor : this.color;
        (<SegmentUniforms> this.segmentMaterial.uniforms).u_segmentColor = color;
        //
        (<ColorUniforms> this.material.uniforms).u_diffuseInput = color;
    }
}

@RegisterComponent()
export class CoordinateCube extends Component
{
    private isinit = false;
    private colorMaterial: Material;
    private oCube: GameObject;

    color = new Color4(1, 1, 1, 0.99);
    selectedColor = new Color4(1, 1, 0, 0.99);
    //
    selected = false;

    init()
    {
        super.init();

        watcher.watch(<CoordinateCube> this, 'selected', this.update, this);

        //
        this.oCube = new GameObject();
        const model = this.oCube.addComponent(Renderable);
        model.geometry = serialization.setValue(new CubeGeometry(), { width: 8, height: 8, depth: 8 });
        this.colorMaterial = model.material = Material.create('color');
        this.colorMaterial.renderParams.enableBlend = true;
        this.oCube.mouseEnabled = true;
        this.gameObject.addChild(this.oCube);

        this.isinit = true;
        this.update();
    }

    update()
    {
        if (!this.isinit) return;
        (<ColorUniforms> this.colorMaterial.uniforms).u_diffuseInput = this.selected ? this.selectedColor : this.color;
    }
}

@RegisterComponent()
export class CoordinatePlane extends Component
{
    private isinit: boolean;
    private colorMaterial: Material;
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

        const plane = serialization.setValue(new GameObject(), { name: 'plane' });
        let model = plane.addComponent(Renderable);
        plane.transform.x = plane.transform.z = this._width / 2;
        model.geometry = serialization.setValue(new PlaneGeometry(), { width: this._width, height: this._width });
        this.colorMaterial = model.material = Material.create('color');
        this.colorMaterial.renderParams.cullFace = CullFace.NONE;
        this.colorMaterial.renderParams.enableBlend = true;
        plane.mouseEnabled = true;
        this.gameObject.addChild(plane);

        const border = serialization.setValue(new GameObject(), { name: 'border' });
        model = border.addComponent(Renderable);
        this.segmentGeometry = model.geometry = new SegmentGeometry();
        model.material = Material.create(
            'segment',
            { u_segmentColor: new Color4(1, 1, 1, 0.99) },
        );
        this.gameObject.addChild(border);

        this.isinit = true;
        this.update();
    }

    update()
    {
        if (!this.isinit) return;

        (<ColorUniforms> this.colorMaterial.uniforms).u_diffuseInput = this.selected ? this.selectedColor : this.color;

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
