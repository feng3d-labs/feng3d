import { RenderAtomic } from '../data/RenderAtomic';
import { WebGLRenderer } from '../WebGLRenderer';
import { UniformInfo } from './WebGLShaders';

/**
 * WebGL统一变量
 */
export class WebGLUniforms
{
    /**
     * 激活常量
     */
    activeUniforms(webGLRenderer: WebGLRenderer, renderAtomic: RenderAtomic, uniformInfos: { [name: string]: UniformInfo })
    {
        for (const name in uniformInfos)
        {
            const activeInfo = uniformInfos[name];
            const paths = activeInfo.paths;
            let uniformData = renderAtomic.getUniformByKey(paths[0]);
            for (let i = 1; i < paths.length; i++)
            {
                uniformData = uniformData[paths[i]];
            }
            this.setContext3DUniform(webGLRenderer, activeInfo, uniformData);
        }
    }

    /**
     * 设置环境Uniform数据
     */
    private setContext3DUniform(webGLRenderer: WebGLRenderer, activeInfo: UniformInfo, data)
    {
        const { gl, textures, webGLContext } = webGLRenderer;

        let vec: number[] = data;
        if (data.toArray) vec = data.toArray();
        const location = activeInfo.location;
        switch (activeInfo.type)
        {
            case gl.BOOL:
            case gl.INT:
                webGLContext.uniform1i(location, data);
                break;
            case gl.FLOAT_MAT3:
                webGLContext.uniformMatrix3fv(location, false, vec);
                break;
            case gl.FLOAT_MAT4:
                webGLContext.uniformMatrix4fv(location, false, vec);
                break;
            case gl.FLOAT:
                webGLContext.uniform1f(location, data);
                break;
            case gl.FLOAT_VEC2:
                webGLContext.uniform2f(location, vec[0], vec[1]);
                break;
            case gl.FLOAT_VEC3:
                webGLContext.uniform3f(location, vec[0], vec[1], vec[2]);
                break;
            case gl.FLOAT_VEC4:
                webGLContext.uniform4f(location, vec[0], vec[1], vec[2], vec[3]);
                break;
            case gl.SAMPLER_2D:
            case gl.SAMPLER_CUBE:
                textures.active(data, activeInfo);
                break;
            default:
                console.error(`无法识别的uniform类型 ${activeInfo.name} ${data}`);
        }
    }
}
