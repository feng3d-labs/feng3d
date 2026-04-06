import { BillboardComponent, Camera, Color4, GameObject, HideFlags, Material, mathUtil, MeshRenderer, PlaneGeometry, PointGeometry, PointInfo, RegisterComponent, Renderable, RenderMode, Segment, SegmentGeometry, SegmentUniforms, serialization, shortcut, SpotLight, Texture2D, TextureFormat, TextureUniforms, ticker, Vector3, watcher } from 'feng3d';
import { EditorData } from '../global/EditorData';
import { EditorScript } from './EditorScript';

declare global
{
    export interface MixinsComponentMap { SpotLightIcon: SpotLightIcon; }
}

@RegisterComponent()
export class SpotLightIcon extends EditorScript
{
    light: SpotLight;

    get editorCamera() { return this._editorCamera; }
    set editorCamera(v) { this._editorCamera = v; this.initicon(); }
    private _editorCamera: Camera;

    constructor()
    {
        super();
        watcher.watch(this as SpotLightIcon, 'light', this.onLightChanged, this);
    }

    init()
    {
        super.init();
        this.initicon();
        this.on('mousedown', this.onMousedown, this);
    }

    initicon()
    {
        if (!this._editorCamera) return;
        {
            const lightIcon = this._lightIcon = new GameObject();
            lightIcon.name = 'SpotLightIcon';
            const billboardComponent = lightIcon.addComponent(BillboardComponent);
            billboardComponent.camera = this.editorCamera;
            const meshRenderer = lightIcon.addComponent(MeshRenderer);
            const material = meshRenderer.material = new Material();
            material.shaderName = 'texture';
            const uniforms = material.uniforms as TextureUniforms;
            const texture = uniforms.s_texture = new Texture2D();
            texture.source = { url: EditorData.editorData.getEditorAssetPath('assets/3d/icons/spot.png') };
            texture.format = TextureFormat.RGBA;
            texture.premulAlpha = true;
            material.renderParams.enableBlend = true;
            const geometry = meshRenderer.geometry = new PlaneGeometry();
            geometry.width = 1;
            geometry.height = 1;
            geometry.segmentsW = 1;
            geometry.segmentsH = 1;
            geometry.yUp = false;
            this._textureMaterial = material;
            this.gameObject.addChild(lightIcon);
        }

        //
        {
            const lightLines = this._lightLines = new GameObject();
            lightLines.name = 'Lines';
            lightLines.mouseEnabled = false;
            lightLines.hideFlags = HideFlags.Hide;
            const meshRenderer = lightLines.addComponent(MeshRenderer);
            const material = meshRenderer.material = new Material();
            material.shaderName = 'segment';
            const uniforms = material.uniforms as SegmentUniforms;
            uniforms.u_segmentColor = new Color4(1, 1, 1, 0.5);
            material.renderParams.enableBlend = true;
            material.renderParams.renderMode = RenderMode.LINES;
            const geometry = meshRenderer.geometry = new SegmentGeometry();
            this._segmentGeometry = geometry;
            this.gameObject.addChild(lightLines);
        }
        //
        const lightpoints = this._lightpoints = serialization.setValue(new GameObject(), {
            name: 'points', mouseEnabled: false, hideFlags: HideFlags.Hide, components: [
                {
                    __class__: 'MeshRenderer',
                    material: { __class__: 'Material', shaderName: 'point', uniforms: { u_PointSize: 5 }, renderParams: { enableBlend: true, renderMode: RenderMode.POINTS } },
                    geometry: { __class__: 'PointGeometry' },
                },
            ]
        });
        this._pointGeometry = <any>lightpoints.getComponent(Renderable).geometry;
        this.gameObject.addChild(lightpoints);

        this.enabled = true;
    }

    update()
    {
        if (!this.light) return;

        (this._textureMaterial.uniforms as TextureUniforms).u_color = this.light.color.toColor4() as any;

        if (EditorData.editorData.selectedGameObjects.indexOf(this.light.gameObject) !== -1)
        {
            //
            const points: PointInfo[] = [];
            const segments: Segment[] = [];
            const num = 36;
            let point0: Vector3;
            let point1: Vector3;
            const radius = this.light.range * Math.tan(this.light.angle * mathUtil.DEG2RAD * 0.5);
            const distance = this.light.range;
            for (let i = 0; i < num; i++)
            {
                const angle = i * Math.PI * 2 / num;
                const x = Math.sin(angle);
                const y = Math.cos(angle);
                const angle1 = (i + 1) * Math.PI * 2 / num;
                const x1 = Math.sin(angle1);
                const y1 = Math.cos(angle1);
                //
                point0 = new Vector3(x * radius, y * radius, distance);
                point1 = new Vector3(x1 * radius, y1 * radius, distance);
                segments.push({ start: point0, end: point1, startColor: new Color4(1, 1, 0, 1), endColor: new Color4(1, 1, 0, 1) });
            }

            //
            points.push({ position: new Vector3(0, 0, distance), color: new Color4(1, 1, 0, 1) });
            segments.push({ start: new Vector3(), end: new Vector3(0, -radius, distance), startColor: new Color4(1, 1, 0, 1), endColor: new Color4(1, 1, 0, 1) });
            points.push({ position: new Vector3(0, -radius, distance), color: new Color4(1, 1, 0, 1) });
            segments.push({ start: new Vector3(), end: new Vector3(-radius, 0, distance), startColor: new Color4(1, 1, 0, 1), endColor: new Color4(1, 1, 0, 1) });
            points.push({ position: new Vector3(-radius, 0, distance), color: new Color4(1, 1, 0, 1) });
            segments.push({ start: new Vector3(), end: new Vector3(0, radius, distance), startColor: new Color4(1, 1, 0, 1), endColor: new Color4(1, 1, 0, 1) });
            points.push({ position: new Vector3(0, radius, distance), color: new Color4(1, 1, 0, 1) });
            segments.push({ start: new Vector3(), end: new Vector3(radius, 0, distance), startColor: new Color4(1, 1, 0, 1), endColor: new Color4(1, 1, 0, 1) });
            points.push({ position: new Vector3(radius, 0, distance), color: new Color4(1, 1, 0, 1) });

            this._pointGeometry.points = points;
            this._segmentGeometry.segments = segments;
            //
            this._lightLines.activeSelf = true;
            this._lightpoints.activeSelf = true;
        }
        else
        {
            this._lightLines.activeSelf = false;
            this._lightpoints.activeSelf = false;
        }
    }

    dispose()
    {
        this.enabled = false;
        this._textureMaterial = null;
        //
        this._lightIcon.dispose();
        this._lightLines.dispose();
        this._lightpoints.dispose();
        this._lightIcon = null;
        this._lightLines = null;
        this._lightpoints = null;
        this._segmentGeometry = null;
        super.dispose();
    }

    //
    private _lightIcon: GameObject;
    private _lightLines: GameObject;
    private _lightpoints: GameObject;
    private _textureMaterial: Material;
    private _segmentGeometry: SegmentGeometry;
    private _pointGeometry: PointGeometry;

    private onLightChanged(value: SpotLight, oldValue: SpotLight)
    {
        if (oldValue)
        {
            oldValue.off('scenetransformChanged', this.onScenetransformChanged, this);
        }
        if (value)
        {
            this.onScenetransformChanged();
            value.on('scenetransformChanged', this.onScenetransformChanged, this);
        }
    }

    private onScenetransformChanged()
    {
        this.transform.localToWorldMatrix = this.light.transform.localToWorldMatrix;
    }

    private onMousedown()
    {
        EditorData.editorData.selectObject(this.light.gameObject);
        // 防止再次调用鼠标拾取
        shortcut.activityState('selectInvalid');
        ticker.once(100, () =>
        {
            shortcut.deactivityState('selectInvalid');
        });
    }
}
