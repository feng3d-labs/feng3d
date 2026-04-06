export default `#if NUM_DIRECTIONALLIGHT_CASTSHADOW > 0
    for ( int i = 0; i < NUM_DIRECTIONALLIGHT_CASTSHADOW; i ++ ) 
    {
        v_directionalShadowCoord[ i ] = u_directionalShadowMatrices[ i ] * worldPosition;
    }
#endif

#if NUM_SPOT_LIGHTS_CASTSHADOW > 0
    for ( int i = 0; i < NUM_SPOT_LIGHTS_CASTSHADOW; i ++ ) 
    {
        v_spotShadowCoord[ i ] = u_spotShadowMatrix[ i ] * worldPosition;
    }
#endif`;
