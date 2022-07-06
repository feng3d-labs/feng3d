namespace feng2d
{
    export class UIUniforms
    {
        __class__: "feng2d.ImageUniforms";

        /**
         * UI几何体尺寸，在shader中进行对几何体缩放。
         */
        u_rect = new feng3d.Vector4(0, 0, 100, 100);

        /** 
         * 颜色
         */
        @feng3d.serialize
        @feng3d.oav()
        u_color = new feng3d.Color4();

        /**
         * 纹理数据
         */
        @feng3d.oav()
        @feng3d.serialize
        s_texture = feng3d.Texture2D.default;

        /**
         * 控制图片的显示区域。
         */
        u_uvRect = new feng3d.Vector4(0, 0, 1, 1);
    }

    feng3d.shaderConfig.shaders["ui"] = {
        vertex: `
    attribute vec2 a_position;
    attribute vec2 a_uv;
    
    uniform vec4 u_uvRect;
    uniform vec4 u_rect;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewProjection;
    
    varying vec2 v_uv;
    varying vec2 v_position;

    void main() 
    {
        vec2 position = u_rect.xy + a_position * u_rect.zw;
        gl_Position = u_viewProjection * u_modelMatrix * vec4(position, 0.0, 1.0);
        v_uv = u_uvRect.xy + a_uv * u_uvRect.zw;
        v_position = position.xy;
    }
    `,
        fragment: `
    precision mediump float;

    uniform sampler2D s_texture;
    varying vec2 v_uv;
    varying vec2 v_position;
    
    uniform vec4 u_color;
    
    void main() 
    {
        vec4 color = texture2D(s_texture, v_uv);
        gl_FragColor = color * u_color;
    }
    
    `,
        cls: UIUniforms,
        renderParams: { enableBlend: true, depthtest: false },
    };

    feng3d.Material.setDefault("Default-UIMaterial", { shaderName: "ui" });
}

namespace feng3d
{
    export interface UniformsTypes { ui: feng2d.UIUniforms }

    export interface Uniforms extends feng2d.UIUniforms
    {
    }

    export interface DefaultMaterial
    {
        "Default-UIMaterial": Material;
    }
}