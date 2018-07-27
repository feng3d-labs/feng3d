precision mediump float;

attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

uniform int u_lightType;
uniform vec3 u_lightPosition;
uniform float u_shadowCameraNear;
uniform float u_shadowCameraFar;
uniform vec2 u_shadowMapSize;

// cubeToUV() maps a 3D direction vector suitable for cube texture mapping to a 2D
// vector suitable for 2D texture mapping. This code uses the following layout for the
// 2D texture:
//
// xzXZ
//  y Y
//
// Y - Positive y direction
// y - Negative y direction
// X - Positive x direction
// x - Negative x direction
// Z - Positive z direction
// z - Negative z direction
//
// Source and test bed:
// https://gist.github.com/tschw/da10c43c467ce8afd0c4

vec2 cubeToUV( vec3 v, float texelSizeY ) {

    // Number of texels to avoid at the edge of each square

    vec3 absV = abs( v );

    // Intersect unit cube

    float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
    absV *= scaleToCube;

    // Apply scale to avoid seams

    // two texels less per square (one texel will do for NEAREST)
    v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );

    // Unwrap

    // space: -1 ... 1 range for each square
    //
    // #X##		dim    := ( 4 , 2 )
    //  # #		center := ( 1 , 1 )

    vec2 planar = v.xy;

    float almostATexel = 1.5 * texelSizeY;
    float almostOne = 1.0 - almostATexel;

    if ( absV.z >= almostOne ) {

        if ( v.z > 0.0 )
            planar.x = 4.0 - v.x;

    } else if ( absV.x >= almostOne ) {

        float signX = sign( v.x );
        planar.x = v.z * signX + 2.0 * signX;

    } else if ( absV.y >= almostOne ) {

        float signY = sign( v.y );
        planar.x = v.x + 2.0 * signY + 2.0;
        planar.y = v.z * signY - 2.0;

    }

    // Transform to UV space

    // scale := 0.5 / dim
    // translate := ( center + 0.5 ) / dim
    return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
}

void main(void) {

    vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);

    if(u_lightType == 1)
    {
        vec3 lightToPosition = worldPosition.xyz - u_lightPosition;
        // dp = normalized distance from light to fragment position
        float dp = ( length( lightToPosition ) - u_shadowCameraNear ) / ( u_shadowCameraFar - u_shadowCameraNear ); // need to clamp?
        // bd3D = base direction 3D
        vec3 bd3D = normalize( lightToPosition );
        vec2 uv = cubeToUV( bd3D, 0.5 / u_shadowMapSize.y );
        // uv = uv * 2.0 - 1.0;
        gl_Position = vec4(uv, dp, 1.0);
    }else
    {
        gl_Position = u_viewProjection * worldPosition;
    }
}