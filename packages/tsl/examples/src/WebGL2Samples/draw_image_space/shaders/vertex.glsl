#version 300 es
precision highp float;
precision highp int;
        
void main()
{
    gl_Position = vec4(2.0 * float(uint(gl_VertexID) % 2u) - 1.0, 2.0 * float(uint(gl_VertexID) / 2u) - 1.0, 0.0, 1.0);
}