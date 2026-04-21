struct VarysStruct {
    @builtin( position ) Position: vec4<f32>,
    @location( 0 ) vUV : vec2<f32>
};

@vertex
fn vsmain(
    @builtin(vertex_index) VertexIndex: u32
) -> VarysStruct {
    var Varys : VarysStruct;

    var pos = array< vec2<f32>, 4 >(
        vec2<f32>( -1.0,  1.0 ),
        vec2<f32>(  1.0,  1.0 ),
        vec2<f32>( -1.0, -1.0 ),
        vec2<f32>(  1.0, -1.0 )
    );

    var tex = array< vec2<f32>, 4 >(
        vec2<f32>( 0.0, 0.0 ),
        vec2<f32>( 1.0, 0.0 ),
        vec2<f32>( 0.0, 1.0 ),
        vec2<f32>( 1.0, 1.0 )
    );

    Varys.vUV = tex[ VertexIndex ];
    Varys.Position = vec4<f32>( pos[ VertexIndex ], 0.0, 1.0 );

    return Varys;
}

struct FragmentOut {
    @location(0) color0: vec4<f32>
};

@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var myTexture: texture_depth_2d;

@fragment
fn fsmain(Varys : VarysStruct) -> FragmentOut {

    var output: FragmentOut;

    var color = textureSample(myTexture, mySampler, Varys.vUV);
    
    output.color0 = vec4<f32>(color,color,color,1.0);

    return output;
}
