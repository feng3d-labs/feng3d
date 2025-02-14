import { $set, LoadImageTexture2D, RenderAtomic, WebGLRenderer } from 'feng3d';

(function ()
{
    const div = document.createElement('div');
    div.innerHTML = `    <div id="info">WebGL 2 Samples - fbo_blit</div>
    <p id="description">
        This samples demonstrates blitting on frame buffer objects.
    </p>`;
    document.body.appendChild(div);

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(window.innerWidth, window.innerHeight);
    canvas.height = canvas.width;
    document.body.appendChild(canvas);

    const gl = canvas.getContext('webgl2', { antialias: false });
    const isWebGL2 = !!gl;
    if (!isWebGL2)
    {
        document.body.innerHTML = 'WebGL 2 is not available.  See <a href="https://www.khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">How to get a WebGL 2 implementation</a>';

        return;
    }

    const diffuse = $set(new LoadImageTexture2D(), {
        flipY: false,
        textureTarget: 'TEXTURE_2D',
        format: 'RGBA',
        type: 'UNSIGNED_BYTE',
        magFilter: 'LINEAR',
        minFilter: 'LINEAR',
        wrapS: 'REPEAT',
        wrapT: 'REPEAT',
        url: '../../assets/img/Di-3d.png',
    });

    const webglRenderer = new WebGLRenderer(canvas);

    const renderAtomic = $set(new RenderAtomic(), {
        attributes: {
            position: {
                array: [
                    -1.0, -1.0,
                    1.0, -1.0,
                    1.0, 1.0,
                    1.0, 1.0,
                    -1.0, 1.0,
                    -1.0, -1.0
                ], itemSize: 2
            },
            texcoord: {
                array: [
                    0.0, 1.0,
                    1.0, 1.0,
                    1.0, 0.0,
                    1.0, 0.0,
                    0.0, 0.0,
                    0.0, 1.0
                ], itemSize: 2
            },
        },
        uniforms: {
            MVP: [
                0.8, 0.0, 0.0, 0.0,
                0.0, 0.8, 0.0, 0.0,
                0.0, 0.0, 0.8, 0.0,
                0.0, 0.0, 0.0, 1.0
            ],
            diffuse,
        },
        drawCall: { drawMode: 'TRIANGLE_STRIP', instanceCount: 2 },
        renderParams: { cullFace: 'NONE', enableBlend: true },
        shader: {
            vertex:
                `#version 300 es
                #define POSITION_LOCATION 0
                #define TEXCOORD_LOCATION 4
                
                precision highp float;
                precision highp int;
        
                uniform mat4 MVP;
        
                layout(location = POSITION_LOCATION) in vec2 position;
                layout(location = TEXCOORD_LOCATION) in vec2 texcoord;
        
                out vec2 v_st;
        
                void main()
                {
                    v_st = texcoord;
                    gl_Position = MVP * vec4(position, 0.0, 1.0);
                }`,
            fragment: `#version 300 es
            precision highp float;
            precision highp int;
    
            uniform sampler2D diffuse;
    
            in vec2 v_st;
    
            out vec4 color;
    
            void main()
            {
                color = texture(diffuse, v_st);
            }` }
    });

    function draw()
    {
        webglRenderer.webGLContext.clearColor(0.0, 0.0, 0.0, 1.0);
        webglRenderer.webGLContext.clear(['COLOR_BUFFER_BIT']);

        webglRenderer.render(renderAtomic);

        requestAnimationFrame(draw);
    }
    draw();
})();
