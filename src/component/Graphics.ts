namespace feng3d
{
    /**
     * Graphics 类包含一组可用来创建矢量形状的方法。
     */
    export class Graphics extends Component 
    {
        __class__: "feng3d.Graphics" = "feng3d.Graphics";

        pen = new Pen();

        constructor()
        {
            super();


        }
    }

    interface Pen extends CanvasRenderingContext2D 
    {
        restore(): void;
        save(): void;
        getTransform(): DOMMatrix;
        resetTransform(): void;
        rotate(angle: number): void;
        scale(x: number, y: number): void;
        setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
        setTransform(transform?: DOMMatrix2DInit): void;
        transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
        translate(x: number, y: number): void;
        globalAlpha: number;
        globalCompositeOperation: string;
        imageSmoothingEnabled: boolean;
        imageSmoothingQuality: ImageSmoothingQuality;
        fillStyle: string | CanvasGradient | CanvasPattern;
        strokeStyle: string | CanvasGradient | CanvasPattern;
        createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient;
        createPattern(image: CanvasImageSource, repetition: string): CanvasPattern | null;
        createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient;
        shadowBlur: number;
        shadowColor: string;
        shadowOffsetX: number;
        shadowOffsetY: number;
        filter: string;
    }

    class Pen 
    {
    }
}