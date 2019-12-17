namespace feng3d
{
    /**
     * Graphics 类包含一组可用来创建矢量形状的方法。
     */
    export class Graphics extends Component 
    {
        __class__: "feng3d.Graphics";

        private image: HTMLImageElement
        private context2D: CanvasRenderingContext2D;
        private canvas: HTMLCanvasElement;
        private width: number;
        private height: number;

        constructor()
        {
            super();

            this.canvas = document.createElement("canvas");
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.context2D = this.canvas.getContext('2d');

            //
            watchContext2D(this.context2D);
        }

        draw(width: number, height: number, callback: (context2D: CanvasRenderingContext2D) => void)
        {
            var canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            var ctxt = canvas.getContext('2d');
            callback(ctxt);
            dataTransform.canvasToImage(canvas, "png", 1, (img) =>
            {
                this.image = img;
            });
            return this;
        }
    }

    export function watchContext2D(context2D: CanvasRenderingContext2D, watchFuncs = ["rect"])
    {
        watchFuncs.forEach(v =>
        {
            var oldFunc = context2D[v];
            context2D[v] = function (...args): void
            {
                oldFunc.apply(context2D, args);
                // 标记更改
                context2D["__changed"] = true;
            }
        });
    }
}

// var ctxts = [];
// var num = 100;
// for (var i = 0; i < num; i++)
// {
//     var canvas = document.createElement("canvas");
//     canvas.width = 100;
//     canvas.height = 100;
//     var ctxt = canvas.getContext('2d');
//     ctxts.push(ctxt);
// }