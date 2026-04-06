export default `//渲染灯光
#if NUM_LIGHT > 0
    finalColor.xyz = lightShading(normal, diffuseColor.xyz, specularColor, ambientColor, glossiness);
#endif`;
