import { Color4, Component, CylinderGeometry, Object3D, ColorMaterial, SegmentMaterial, RegisterComponent, Renderable, SegmentGeometry, serialization, Vector3, reactive, watcher } from 'feng3d';
import { CoordinateCube } from './MToolModel';
import { setBlendEnabled } from '../../../utils/materialRenderState';

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
        this.object3D.name = 'Object3DScaleModel';
        this.initModels();
    }

    private initModels()
    {
        this.xCube = serialization.setValue(new Object3D(), { name: 'xCube' }).addComponent(CoordinateScaleCube);
        this.xCube.color.setTo(1, 0, 0, 1);
        this.xCube.update();
        { const r = reactive(this.xCube.transform.rotation); r.z = -90; }
        this.object3D.addChild(this.xCube.object3D);

        this.yCube = serialization.setValue(new Object3D(), { name: 'yCube' }).addComponent(CoordinateScaleCube);
        this.yCube.color.setTo(0, 1, 0, 1);
        this.yCube.update();
        this.object3D.addChild(this.yCube.object3D);

        this.zCube = serialization.setValue(new Object3D(), { name: 'zCube' }).addComponent(CoordinateScaleCube);
        this.zCube.color.setTo(0, 0, 1, 1);
        this.zCube.update();
        { const r = reactive(this.zCube.transform.rotation); r.x = 90; }
        this.object3D.addChild(this.zCube.object3D);

        this.oCube = serialization.setValue(new Object3D(), { name: 'oCube' }).addComponent(CoordinateCube);
        {
            const r = reactive(this.oCube.object3D.transform.scale);
            r.x = 1.2; r.y = 1.2; r.z = 1.2;
        }
        this.object3D.addChild(this.oCube.object3D);
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

        const xLine = new Object3D();
        let model = xLine.addComponent(Renderable);
        const material = model.material = new SegmentMaterial();
        reactive(material.uniforms).u_segmentColor = new Color4(1, 1, 1, 0.99);
        setBlendEnabled(material, true);
        this.segmentGeometry = model.geometry = new SegmentGeometry();
        this.object3D.addChild(xLine);
        this.coordinateCube = serialization.setValue(new Object3D(), { name: 'coordinateCube' }).addComponent(CoordinateCube);
        this.object3D.addChild(this.coordinateCube.object3D);

        const mouseHit = serialization.setValue(new Object3D(), { name: 'hit' });
        model = mouseHit.addComponent(Renderable);
        model.geometry = serialization.setValue(new CylinderGeometry(), { topRadius: 5, bottomRadius: 5, height: this.length - 4 });
        model.material = new ColorMaterial();
        { const r = reactive(mouseHit.transform.position); r.y = 4 + (this.length - 4) / 2; }
        mouseHit.activeSelf = false;
        mouseHit.mouseEnabled = true;
        this.object3D.addChild(mouseHit);

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
        { const r = reactive(this.coordinateCube.transform.position); r.y = this.length * this.scaleValue; }
        this.coordinateCube.selected = this.selected;
    }
}
