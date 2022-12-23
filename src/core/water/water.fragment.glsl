precision mediump float;  

uniform vec3 u_cameraPos;

varying vec4 v_mirrorCoord;
varying vec4 v_worldPosition;

uniform sampler2D s_mirrorSampler;
uniform sampler2D s_normalSampler;

uniform float u_alpha;
uniform float u_time;
uniform float u_size;
uniform float u_distortionScale;
uniform vec3 u_sunColor;
uniform vec3 u_sunDirection;
uniform vec3 u_waterColor;

vec4 getNoise( vec2 uv ) 
{
	vec2 uv0 = ( uv / 103.0 ) + vec2(u_time / 17.0, u_time / 29.0);
	vec2 uv1 = uv / 107.0-vec2( u_time / -19.0, u_time / 31.0 );
	vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( u_time / 101.0, u_time / 97.0 );
	vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( u_time / 109.0, u_time / -113.0 );
	vec4 noise = texture2D( s_normalSampler, uv0 ) +
		texture2D( s_normalSampler, uv1 ) +
		texture2D( s_normalSampler, uv2 ) +
		texture2D( s_normalSampler, uv3 );
	return noise * 0.5 - 1.0;
}

void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) 
{
	vec3 reflection = normalize( reflect( -u_sunDirection, surfaceNormal ) );
	float direction = max( 0.0, dot( eyeDirection, reflection ) );
	specularColor += pow( direction, shiny ) * u_sunColor * spec;
	diffuseColor += max( dot( u_sunDirection, surfaceNormal ), 0.0 ) * u_sunColor * diffuse;
}

void main() 
{
	vec4 noise = getNoise( v_worldPosition.xz * u_size );
	vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );
	vec3 diffuseLight = vec3(0.0);
	vec3 specularLight = vec3(0.0);
	vec3 worldToEye = u_cameraPos-v_worldPosition.xyz;
	vec3 eyeDirection = normalize( worldToEye );
	sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );
	float distance = length(worldToEye);
	vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * u_distortionScale;
	vec3 reflectionSample = vec3( texture2D( s_mirrorSampler, v_mirrorCoord.xy / v_mirrorCoord.z + distortion ) );
	float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
	float rf0 = 0.3;
	float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
	vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * u_waterColor;

	float shadowMask = 1.0;
	// float shadowMask = getShadowMask();

	vec3 albedo = mix( ( u_sunColor * diffuseLight * 0.3 + scatter ) * shadowMask, ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
	vec3 outgoingLight = albedo;
	gl_FragColor = vec4( outgoingLight, u_alpha );

	// debug
	// gl_FragColor = texture2D( s_mirrorSampler, (v_mirrorCoord.xy / v_mirrorCoord.z + 1.0) / 2.0 );
	// gl_FragColor = vec4( reflectionSample, 1.0 );
	// gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}