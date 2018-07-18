#if NUM_DIRECTIONALLIGHT_CASTSHADOW > 0
	for ( int i = 0; i < NUM_DIRECTIONALLIGHT_CASTSHADOW; i ++ ) 
    {
		v_directionalShadowCoord[ i ] = u_directionalShadowMatrix[ i ] * worldPosition;
	}
#endif