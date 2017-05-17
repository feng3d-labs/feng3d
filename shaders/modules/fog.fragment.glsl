#define FOGMODE_NONE    0.
#define FOGMODE_EXP     1.
#define FOGMODE_EXP2    2.
#define FOGMODE_LINEAR  3.
#define E 2.71828

uniform float u_fogMode;
uniform float u_fogMinDistance;
uniform float u_fogMaxDistance;
uniform float u_fogDensity;
uniform vec3 u_fogColor;

float CalcFogFactor(float fogDistance)
{
	float fogCoeff = 1.0;
	if (FOGMODE_LINEAR == u_fogMode)
	{
		fogCoeff = (u_fogMaxDistance - fogDistance) / (u_fogMaxDistance - u_fogMinDistance);
	}
	else if (FOGMODE_EXP == u_fogMode)
	{
		fogCoeff = 1.0 / pow(E, fogDistance * u_fogDensity);
	}
	else if (FOGMODE_EXP2 == u_fogMode)
	{
		fogCoeff = 1.0 / pow(E, fogDistance * fogDistance * u_fogDensity * u_fogDensity);
	}

	return clamp(fogCoeff, 0.0, 1.0);
}

vec4 fogMethod(vec4 color)
{
    vec3 fogDistance = u_cameraMatrix[3].xyz - v_globalPosition.xyz;
	float fog = CalcFogFactor(length(fogDistance));
	color.rgb = fog * color.rgb + (1.0 - fog) * u_fogColor;
    return color;
}