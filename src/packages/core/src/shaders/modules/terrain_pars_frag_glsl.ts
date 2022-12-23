export default `#ifdef USE_TERRAIN_MERGE
    #include<terrainMerge_pars_frag>
#else
    #include<terrainDefault_pars_frag>
#endif`;
