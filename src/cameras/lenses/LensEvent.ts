module feng3d
{
	/**
	 * 镜头事件
	 * @author feng 2014-10-14
	 */
    export class LensEvent extends Event
    {
        public static MATRIX_CHANGED: string = "matrixChanged";

        constructor(type: string, lens: LensBase = null, bubbles: boolean = false)
        {
            super(type, lens, bubbles);
        }

        public get lens(): LensBase
        {
            return this.data as LensBase;
        }
    }
}
