import { RenderAtomic, WebGLRenderer } from '../../../src';

(function ()
{
    const div = document.createElement('div');
    div.innerHTML = ` <div id="info">WebGL 2 Samples - draw_primitive_restart</div>`;
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

    // https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.18
    // WebGL 2.0 behaves as though PRIMITIVE_RESTART_FIXED_INDEX were always enabled.
    const MAX_UNSIGNED_SHORT = 65535;

    const webglRenderer = new WebGLRenderer({ canvas });

    const renderAtomic = new RenderAtomic({
        attributes: {
            pos: {
                array: [
                    -1.0, -1.0,
                    -1.0, 1.0,
                    1.0, -1.0,
                    1.0, 1.0,
                ], itemSize: 2
            },
        },
        uniforms: {},
        index: {
            array: [
                0, 1, 2, MAX_UNSIGNED_SHORT, 2, 3, 1
            ]
        },
        instanceCount: 2,
        renderParams: { renderMode: 'TRIANGLE_STRIP', cullFace: 'NONE', enableBlend: true },
        shader: {
            vertex:
                `#version 300 es
                precision highp float;
                precision highp int;
        
                layout(location = 0) in vec2 pos;
        
                void main()
                {
                    gl_Position = vec4(pos, 0.0, 1.0);
                }`,
            fragment: `#version 300 es
            precision highp float;
            precision highp int;
    
            out vec4 color;
    
            void main()
            {
                color = vec4(1.0, 0.5, 0.0, 1.0);
            }` }
    });

    function draw()
    {
        webglRenderer.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        webglRenderer.gl.clear(webglRenderer.gl.COLOR_BUFFER_BIT);
        webglRenderer.render(renderAtomic);
        requestAnimationFrame(draw);
    }
    draw();
})();
