import { RegisterComponent, Component, oav, Camera, SegmentGeometry, serialization, GameObject, Renderable, Material, Color4, Segment, Vector3 } from 'feng3d';

declare global
{
    export interface MixinsComponentMap { GroundGrid: GroundGrid }
}

/**
 * 地面网格
 */
@RegisterComponent()
export class GroundGrid extends Component
{
    @oav()
    private num = 100;

    get editorCamera() { return this._editorCamera; }
    set editorCamera(v)
    {
        if (this._editorCamera === v) return;
        if (this._editorCamera)
        {
            this._editorCamera.transform.off('transformChanged', this.update, this);
        }
        this._editorCamera = v;
        if (this._editorCamera)
        {
            this._editorCamera.transform.on('transformChanged', this.update, this);
            this.update();
        }
    }
    private _editorCamera: Camera;
    private segmentGeometry: SegmentGeometry;

    init()
    {
        super.init();

        const groundGridObject = serialization.setValue(new GameObject(), { name: 'GroundGrid' });
        groundGridObject.mouseEnabled = false;

        this._gameObject.addChild(groundGridObject);

        const model = groundGridObject.addComponent(Renderable);
        this.segmentGeometry = model.geometry = new SegmentGeometry();
        model.material = Material.getDefault('Segment-Material');
    }

    update()
    {
        if (!this.editorCamera) return;

        const cameraGlobalPosition = this.editorCamera.transform.worldPosition;
        const level = Math.floor(Math.log(Math.abs(cameraGlobalPosition.y)) / Math.LN10 + 1);
        let step = Math.pow(10, level - 1);

        let startX: number = Math.round(cameraGlobalPosition.x / (10 * step)) * 10 * step;
        let startZ: number = Math.round(cameraGlobalPosition.z / (10 * step)) * 10 * step;

        // 设置在原点
        startX = startZ = 0;
        step = 1;

        const halfNum = this.num / 2;

        const xcolor = new Color4(1, 0, 0, 0.5);
        const zcolor = new Color4(0, 0, 1, 0.5);
        let color: Color4;
        const segments: Segment[] = [];
        for (let i = -halfNum; i <= halfNum; i++)
        {
            const color0 = new Color4().fromUnit((i % 10) === 0 ? 0x888888 : 0x777777);
            color0.a = ((i % 10) === 0) ? 0.5 : 0.1;
            color = (i * step + startZ === 0) ? xcolor : color0;
            segments.push({ start: new Vector3(-halfNum * step + startX, 0, i * step + startZ), end: new Vector3(halfNum * step + startX, 0, i * step + startZ), startColor: color, endColor: color });
            color = (i * step + startX === 0) ? zcolor : color0;
            segments.push({ start: new Vector3(i * step + startX, 0, -halfNum * step + startZ), end: new Vector3(i * step + startX, 0, halfNum * step + startZ), startColor: color, endColor: color });
        }
        this.segmentGeometry.segments = segments;
    }
}
