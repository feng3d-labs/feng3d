module feng3d
{

    export class TextureType
    {
        public static TEXTURE_2D: number;
        public static TEXTURE_CUBE_MAP: number;
    }

    (initFunctions || (initFunctions = [])).push(() =>
    {
        TextureType.TEXTURE_2D = GL.TEXTURE_2D;
        TextureType.TEXTURE_CUBE_MAP = GL.TEXTURE_CUBE_MAP;
    });
}