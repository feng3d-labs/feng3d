module feng3d
{
    /**
     * feng3d的版本号
     * @author feng 2015-03-20
     */
    var $REVISION: string = "0.0.0";
    console.log(`Feng3D version ${$REVISION}`)

    try
    {
        WebGL2RenderingContext;
    } catch (error)
    {
        alert("浏览器不支持 WebGL2!");
        window.location.href = "https://wardenfeng.github.io/#!blogs/2017/01/10/1.md";
    }
}