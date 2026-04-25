import { Color4, Component, CylinderGeometry, GameObject, Material, RegisterComponent, Renderable, RenderMode, SegmentGeometry, serialization, Vector3, watcher } from 'feng3d';
import { CoordinateCube } from './MToolModel';

declare global
{
    export interface MixinsComponentMap { SToolModel: SToolModel }
    export interface MixinsComponentMap { CoordinateCube: CoordinateCube }
    export interface MixinsComponentMap { CoordinateScaleCube: CoordinateScaleCube }
}
/**
 * 缩放工具模型组件
 */
@RegisterComponent()
export class SToolModel extends Component
{
    xCube: CoordinateScaleCube;
    yCube: CoordinateScaleCube;
    zCube: CoordinateScaleCube;
    oCube: CoordinateCube;

    init()
    {
        super.init();
        this.gameObject.name = 'GameObjectScaleModel';
        this.initModels();
    }

    private initModels()
    {
        this.xCube = serialization.setValue(new GameObject(), { name: 'xCube' }).addComponent(CoordinateScaleCube);
        this.xCube.color.setTo(1, 0, 0, 1);
        this.xCube.update();
        this.xCube.transform.rz = -90;
        this.gameObject.addChild(this.xCube.gameObject);

        this.yCube = serialization.setValue(new GameObject(), { name: 'yCube' }).addComponent(CoordinateScaleCube);
        this.yCube.color.setTo(0, 1, 0, 1);
        this.yCube.update();
        this.gameObject.addChild(this.yCube.gameObject);

        this.zCube = serialization.setValue(new GameObject(), { name: 'zCube' }).addComponent(CoordinateScaleCube);
        this.zCube.color.setTo(0, 0, 1, 1);
        this.zCube.update();
        this.zCube.transform.rx = 90;
        this.gameObject.addChild(this.zCube.gameObject);

        this.oCube = serialization.setValue(new GameObject(), { name: 'oCube' }).addComponent(CoordinateCube);
        this.oCube.gameObject.transform.scale = new Vector3(1.2, 1.2, 1.2);
        this.gameObject.addChild(this.oCube.gameObject);
    }
}

@RegisterComponent()
export class CoordinateScaleCube extends Component
{
    private isinit: boolean;
    private coordinateCube: CoordinateCube;
    private segmentGeometry: SegmentGeometry;

    readonly color = new Color4(1, 0, 0, 0.99);
    private selectedColor = new Color4(1, 1, 0, 0.99);
    private length = 100;
    //
    selected = false;
    //
    scaleValue = 1;

    init()
    {
        super.init();
        watcher.watch(<CoordinateScaleCube> this, 'selected', this.update, this);
        watcher.watch(<CoordinateScaleCube> this, 'scaleValue', this.update, this);

        const xLine = new GameObject();
        let model = xLine.addComponent(Renderable);
        const material = model.material = serialization.setValue(new Material(), {
            shaderName: 'segment', renderParams: { renderMode: RenderMode.LINES },
            uniforms: { u_segmentColor: new Color4(1, 1, 1, 0.99) },
        });
        material.renderParams.enableBlend = true;
        this.segmentGeometry = model.geometry = new SegmentGeometry();
        this.gameObject.addChild(xLine);
        this.coordinateCube = serialization.setValue(new GameObject(), { name: 'coordinateCube' }).addComponent(CoordinateCube);
        this.gameObject.addChild(this.coordinateCube.gameObject);

        const mouseHit = serialization.setValue(new GameObject(), { name: 'hit' });
        model = mouseHit.addComponent(Renderable);
        model.geometry = serialization.setValue(new CylinderGeometry(), { topRadius: 5, bottomRadius: 5, height: this.length - 4 });
        model.material = new Material();
        mouseHit.transform.y = 4 + (this.length - 4) / 2;
        mouseHit.activeSelf = false;
        mouseHit.mouseEnabled = true;
        this.gameObject.addChild(mouseHit);

        this.isinit = true;
        this.update();
    }

    update()
    {
        if (!this.isinit) return;

        this.coordinateCube.color = this.color;
        this.coordinateCube.selectedColor = this.selectedColor;
        this.coordinateCube.update();

        this.segmentGeometry.segments = [{ start: new Vector3(), end: new Vector3(0, this.scaleValue * this.length, 0), startColor: this.color, endColor: this.color }];

        //
        this.coordinateCube.transform.y = this.length * this.scaleValue;
        this.coordinateCube.selected = this.selected;
    }
}
