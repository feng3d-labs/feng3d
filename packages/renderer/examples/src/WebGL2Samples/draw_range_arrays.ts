import { RenderAtomic, WebGLRenderer } from '../../../src';

(function ()
{
    const div = document.createElement('div');
    div.innerHTML = `<div id="info">WebGL 2 Samples - draw_range_arrays</div>`;
    document.body.appendChild(div);

    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const gl = canvas.getContext('webgl2', { antialias: false });
    const isWebGL2 = !!gl;
    if (!isWebGL2)
    {
        document.body.innerHTML = 'WebGL 2 is not available.  See <a href="https://www.khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">How to get a WebGL 2 implementation</a>';

        return;
    }

    const webglRenderer = new WebGLRenderer({ canvas });

    const vertexCount = 12;
    const renderAtomic = new RenderAtomic({
        attributes: {
            position: {
                array: [
                    -0.8, -0.8,
                    0.8, -0.8,
                    0.8, 0.8,
                    0.8, 0.8,
                    -0.8, 0.8,
                    -0.8, -0.8,
                    -0.5, -0.5,
                    0.5, -0.5,
                    0.5, 0.5,
                    0.5, 0.5,
                    -0.5, 0.5,
                    -0.5, -0.5,
                ], itemSize: 2
            },
        },
        uniforms: {},
        renderParams: { renderMode: 'TRIANGLE_STRIP', cullFace: 'NONE', enableBlend: true },
        shader: {
            vertex:
                `#version 300 es
                #define POSITION_LOCATION 0
                
                precision highp float;
                precision highp int;
        
                layout(location = POSITION_LOCATION) in vec2 position;
        
                void main()
                {
                    gl_Position = vec4(position, 0.0, 1.0);
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

        renderAtomic.renderParams.useViewPort = true;
        renderAtomic.renderParams.viewPort = { x: 0, y: 0, width: canvas.width / 2, height: canvas.height };
        webglRenderer.render(renderAtomic, 0, vertexCount / 2);
        renderAtomic.renderParams.viewPort = { x: canvas.width / 2, y: 0, width: canvas.width / 2, height: canvas.height };
        webglRenderer.render(renderAtomic, 6, vertexCount / 2);

        requestAnimationFrame(draw);
    }
    draw();
})();
