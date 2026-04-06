export class AssetFileTemplates
{
    /**
     *
     * @param scriptName 脚本名称（类名）
     */
    getNewScript(scriptName: string)
    {
        return scriptTemplate.replace('NewScript', scriptName);
    }
    /**
     *
     * @param shadername shader名称
     */
    getNewShader(shadername: string)
    {
        return shaderTemplate.replace(new RegExp('NewShader', 'g'), shadername);
    }
}
export const assetFileTemplates = new AssetFileTemplates();

const scriptTemplate = `
@feng3d.decoratorRegisterClass()
class NewScript extends feng3d.Script
{

    /** 
     * 测试属性 
     */
    @feng3d.serialize
    @feng3d.oav()
    t_attr = new feng3d.Color4();

    /**
     * 初始化时调用
     */
    init()
    {

    }

    /**
     * 更新
     */
    update()
    {

    }

    /**
     * 销毁时调用
     */
    dispose()
    {

    }
}`;

const shaderTemplate = `
class NewShaderUniforms
{
    /** 
     * 颜色 
     */
    @feng3d.serialize
    @feng3d.oav()
    u_color = new feng3d.Color4();
}

shaderConfig.shaders["NewShader"] = {
    cls: NewShaderUniforms,
    vertex: \`
    
    attribute vec3 a_position;
    
    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewProjection;
    
    void main() {
    
        vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);
        gl_Position = u_viewProjection * globalPosition;
    }\`,
    fragment: \`
    
    precision mediump float;
    
    uniform vec4 u_color;
    
    void main() {
        
        gl_FragColor = u_color;
    }
    \`,
};

type NewShaderMaterial = Material & { uniforms: NewShaderUniforms; };
interface MaterialFactory
{
    create(shader: "NewShader", raw?: gPartial<NewShaderMaterial>): NewShaderMaterial;
}

interface MaterialRawMap
{
    NewShader: gPartial<NewShaderMaterial>;
}`;
