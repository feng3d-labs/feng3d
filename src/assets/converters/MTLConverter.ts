namespace feng3d
{
    /**
     * OBJ模型MTL材质转换器
     */
    export var mtlConverter: MTLConverter;

    /**
     * OBJ模型MTL材质转换器
     */
    export class MTLConverter
    {
        /**
         * OBJ模型MTL材质原始数据转换引擎中材质对象
         * @param mtl MTL材质原始数据
         */
        convert(mtl: Mtl_Mtl, completed?: (err: Error, materials: { [name: string]: Material; }) => void)
        {
            var materials: { [name: string]: Material } = {};
            for (const name in mtl)
            {
                var materialInfo = mtl[name];
                var material = materials[name] = Object.setValue(new Material(), {
                    name: materialInfo.name,
                    uniforms: {
                        u_diffuse: { r: materialInfo.kd[0], g: materialInfo.kd[1], b: materialInfo.kd[2], },
                        u_specular: { r: materialInfo.ks[0], g: materialInfo.ks[1], b: materialInfo.ks[2], },
                    },
                });
                feng3dDispatcher.dispatch("assets.parsed", material);
            }
            completed && completed(null, materials);
        }
    }
    mtlConverter = new MTLConverter();
}