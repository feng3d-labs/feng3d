import { RegisterComponent, DirectionalLight, Camera, watcher, GameObject, BillboardComponent, MeshRenderer, PlaneGeometry, Material, TextureUniforms, Texture2D, TextureFormat, Segment, Vector3, HideFlags, HoldSizeComponent, SegmentUniforms, Color4, RenderMode, SegmentGeometry, shortcut, ticker } from 'feng3d';
import { EditorData } from '../global/EditorData';
import { EditorScript } from './EditorScript';

declare global
{
    export interface MixinsComponentMap { DirectionLightIcon: DirectionLightIcon; }
}

@RegisterComponent()
export class DirectionLightIcon extends EditorScript
{
    __class__: 'editor.DirectionLightIcon';

    light: DirectionalLight;

    get editorCamera() { return this._editorCamera; }
    set editorCamera(v) { this._editorCamera = v; this.initicon(); }
    private _editorCamera: Camera;

    init()
    {
        super.init();
        watcher.watch(this as DirectionLightIcon, 'light', this.onLightChanged, this);
        this.initicon();
        this.on('mousedown', this.onMousedown, this);
    }

    initicon()
    {
        if (!this._editorCamera) return;

        const linesize = 20;

        {
            const lightIcon = this._lightIcon = new GameObject();
            lightIcon.name = 'DirectionLightIcon';
            const billboardComponent = lightIcon.addComponent(BillboardComponent);
            billboardComponent.camera = this.editorCamera;
            const meshRenderer = lightIcon.addComponent(MeshRenderer);
            const geometry = meshRenderer.geometry = new PlaneGeometry();
            geometry.width = 1;
            geometry.height = 1;
            geometry.segmentsH = 1;
            geometry.segmentsW = 1;
            geometry.yUp = false;
            const material = meshRenderer.material = new Material();
            material.shaderName = 'texture';
            const uniforms = material.uniforms as TextureUniforms;
            const texture = uniforms.s_texture = new Texture2D();
            texture.source = { url: EditorData.editorData.getEditorAssetPath('assets/3d/icons/sun.png') };
            texture.format = TextureFormat.RGBA;
            texture.premulAlpha = true;
            material.renderParams.enableBlend = true;
            this._textureMaterial = material;
            this.gameObject.addChild(lightIcon);
        }

        //
        let num = 10;
        const segments: Segment[] = [];
        for (let i = 0; i < num; i++)
        {
            const angle = i * Math.PI * 2 / num;
            const x = Math.sin(angle) * linesize;
            const y = Math.cos(angle) * linesize;
            const segment = new Segment();
            segment.start = new Vector3(x, y, 0);
            segment.end = new Vector3(x, y, linesize * 5);
            segments.push(segment);
        }
        num = 36;
        for (let i = 0; i < num; i++)
        {
            const angle = i * Math.PI * 2 / num;
            const x = Math.sin(angle) * linesize;
            const y = Math.cos(angle) * linesize;
            const angle1 = (i + 1) * Math.PI * 2 / num;
            const x1 = Math.sin(angle1) * linesize;
            const y1 = Math.cos(angle1) * linesize;
            const segment = new Segment();
            segment.start = new Vector3(x, y, 0);
            segment.end = new Vector3(x1, y1, 0);
            segments.push(segment);
        }
        {
            const lightLines = this._lightLines = new GameObject();
            lightLines.name = 'Lines';
            lightLines.mouseEnabled = false;
            lightLines.hideFlags = HideFlags.Hide;
            const holdSizeComponent = lightLines.addComponent(HoldSizeComponent);
            holdSizeComponent.camera = this.editorCamera;
            holdSizeComponent.holdSize = 0.005;
            const meshRenderer = lightLines.addComponent(MeshRenderer);
            const material = meshRenderer.material = new Material();
            material.shaderName = 'segment';
            const uniforms = material.uniforms as SegmentUniforms;
            uniforms.u_segmentColor = new Color4(163 / 255, 162 / 255, 107 / 255);
            material.renderParams.renderMode = RenderMode.LINES;
            const geometry = meshRenderer.geometry = new SegmentGeometry();
            geometry.segments = segments;
            this.gameObject.addChild(lightLines);
        }

        this.enabled = true;
    }

    update()
    {
        if (!this.light) return;

        (this._textureMaterial.uniforms as TextureUniforms).u_color = this.light.color.toColor4() as any;
        this._lightLines.activeSelf = EditorData.editorData.selectedGameObjects.indexOf(this.light.gameObject) !== -1;
    }

    dispose()
    {
        this.enabled = false;
        this._textureMaterial = null;
        //
        this._lightIcon.dispose();
        this._lightLines.dispose();
        this._lightIcon = null;
        this._lightLines = null;
        super.dispose();
    }

    private _lightIcon: GameObject;
    private _lightLines: GameObject;
    private _textureMaterial: Material;

    private onLightChanged(newValue: DirectionalLight, oldValue: DirectionalLight)
    {
        if (oldValue)
        {
            oldValue.off('scenetransformChanged', this.onScenetransformChanged, this);
        }
        if (newValue)
        {
            this.onScenetransformChanged();
            newValue.on('scenetransformChanged', this.onScenetransformChanged, this);
        }
    }

    private onScenetransformChanged()
    {
        this.transform.localToWorldMatrix = this.light.transform.localToWorldMatrix;
    }

    private onMousedown()
    {
        EditorData.editorData.selectObject(this.light.gameObject);
        shortcut.activityState('selectInvalid');
        ticker.once(100, () =>
        {
            shortcut.deactivityState('selectInvalid');
        });
    }
}
