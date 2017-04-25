module feng3d
{
    export function initWebGL(gl: GL)
    {
        for (var key in gl)
        {
            var element = gl[key];
            if (typeof element == "number")
            {
                GL[key] = element;
            }
        }
    }
}