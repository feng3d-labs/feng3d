#if NUM_DIRECTIONALLIGHT_CASTSHADOW > 0
	for ( int i = 0; i < NUM_DIRECTIONALLIGHT_CASTSHADOW; i ++ ) 
	{
		v_directionalShadowCoord[ i ] = u_directionalShadowMatrixs[ i ] * worldPosition;
	}
#endif

#if NUM_POINTLIGHT_CASTSHADOW > 0
	for ( int i = 0; i < NUM_POINTLIGHT_CASTSHADOW; i ++ ) 
	{
		v_pointShadowCoord[ i ] = u_pointShadowMatrixs[ i ] * worldPosition;
	}
#endif