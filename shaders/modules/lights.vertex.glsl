#if NUM_DIRECTIONALLIGHT_CASTSHADOW > 0
	vec4 shadowCoord;
	for ( int i = 0; i < NUM_DIRECTIONALLIGHT_CASTSHADOW; i ++ ) 
	{
		shadowCoord = u_directionalShadowMatrix[ i ] * worldPosition;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord = (shadowCoord + 1.0) / 2.0;
		
		v_directionalShadowCoord[ i ] = shadowCoord;
	}
#endif