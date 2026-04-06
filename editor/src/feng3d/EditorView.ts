import { View, Color4, Scene, RunEnvironment, forwardRenderer, Renderable, wireframeRenderer } from 'feng3d';
import { EditorData } from '../global/EditorData';
import { EditorComponent } from './EditorComponent';
import { hierarchy } from './hierarchy/Hierarchy';

// 获取原始对象的辅助函数（避免 Vue Proxy 干扰 feng3d 事件系统）
function getRawObject<T>(obj: T): T {
    if (!obj) return obj;
    
    // 检查是否是 Vue Proxy（通过检查是否有 __v_raw 属性）
    const proxy = obj as any;
    if (proxy && typeof proxy === 'object' && '__v_raw' in proxy) {
        return proxy.__v_raw;
    }
    
    // 尝试使用全局的 toRaw（如果 Vue 已加载）
    if (typeof (window as any).toRaw === 'function') {
        try {
            return (window as any).toRaw(obj);
        } catch (e) {
            // 忽略错误
        }
    }
    
    return obj;
}

export class EditorView extends View
{
    wireframeColor = new Color4(125 / 255, 176 / 255, 250 / 255);

    /**
     * 编辑器场景，用于显示只在编辑器中存在的游戏对象，例如灯光Icon，对象操作工具等显示。
     */
    editorScene: Scene;

    editorComponent: EditorComponent;

    /**
     * Stats 实例（可选，由 SceneView 设置）
     */
    statsInstance?: any;

    /**
     * 绘制场景
     */
    render()
    {
        // 在渲染开始时调用 Stats.begin()
        if (this.statsInstance) {
            this.statsInstance.begin();
        }
        if (EditorData.editorData.gameScene !== this.scene)
        {
            if (this.scene)
            {
                this.scene.runEnvironment = RunEnvironment.feng3d;
            }
            this.scene = EditorData.editorData.gameScene;
            if (this.scene)
            {
                this.scene.runEnvironment = RunEnvironment.editor;
                hierarchy.rootGameObject = this.scene.gameObject;
            }
        }
        if (this.editorComponent)
        {
            this.editorComponent.scene = getRawObject(this.scene);
            this.editorComponent.editorCamera = getRawObject(this.camera);
        }

        // 只有在场景已初始化时才调用 super.render()
        // 避免 CanvasRenderer.draw() 在 null scene 上调用 getComponentsInChildren
        if (this.scene && this.scene.gameObject) {
            super.render();
        } else {
            // 场景未初始化时，只更新编辑器场景（如果有）
            if (this.editorScene && this.camera) {
                this.editorScene.mouseRay3D = this.mouseRay3D;
                this.editorScene.camera = this.camera;
                this.editorScene.update();
                forwardRenderer.draw(this.gl, this.editorScene, this.camera);
            }
            // 在提前返回前调用 Stats.end()
            if (this.statsInstance) {
                this.statsInstance.end();
                this.statsInstance.update();
            }
            return;
        }

        if (this.contextLost) {
            // 在提前返回前调用 Stats.end()
            if (this.statsInstance) {
                this.statsInstance.end();
                this.statsInstance.update();
            }
            return;
        }

        if (this.editorScene)
        {
            // 设置鼠标射线
            this.editorScene.mouseRay3D = this.mouseRay3D;
            this.editorScene.camera = this.camera;

            this.editorScene.update();
            forwardRenderer.draw(this.gl, this.editorScene, this.camera);
            const selectedObject = this.mouse3DManager.pick(this, this.editorScene, this.camera);
            if (selectedObject) this.selectedObject = selectedObject;
        }
        if (this.scene)
        {
            EditorData.editorData.selectedGameObjects.forEach((element) =>
            {
                if (element.getComponent(Renderable))
                {
                    wireframeRenderer.drawGameObject(this.gl, element.getComponent(Renderable), this.scene, this.camera, this.wireframeColor);
                }
            });
        }
        
        // 在渲染结束时调用 Stats.end() 和 update()
        if (this.statsInstance) {
            this.statsInstance.end();
            this.statsInstance.update();
        }
    }
}

