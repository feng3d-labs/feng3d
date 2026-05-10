struct VaryingStruct {
    @builtin(position) vPosition: vec4<f32>,
    @location(0) vTextureCoord: vec2<f32>,
    @location(1) vFragPosition: vec4<f32>,
}
@binding(1) @group(0) var<uniform> uProjectionMatrix : mat4x4<f32>;
@binding(0) @group(0) var<uniform> uModelViewMatrix : mat4x4<f32>;

@vertex
fn main(
    @location(0) aVertexPosition: vec3<f32>,
    @location(1) aTextureCoord: vec2<f32>,
) -> VaryingStruct {
    var v: VaryingStruct;
    var position = vec4<f32>(aVertexPosition, 1.0);
    v.vPosition = uProjectionMatrix * uModelViewMatrix * position;
    v.vTextureCoord = aTextureCoord;
    var fragPos = 0.5 * (vec4<f32>(aVertexPosition, 1.0) + vec4<f32>(1.0));
    v.vFragPosition = fragPos;
    return v;
}
