import { bezier } from 'feng3d';
import { clearCanvas, createCanvas, drawPointsCurve, getColors } from './Common';

(() =>
{
    const input = <HTMLInputElement>document.getElementById('input');
    const button = document.getElementById('button');
    const stopBtn = <HTMLInputElement>document.getElementById('stopBtn');
    // 创建画布
    const canvas = createCanvas(0, 60, window.innerWidth, window.innerHeight - 60);
    input.value = `${64}`;
    let requestid;
    let isStop = false;

    draw();

    button.onclick = function ()
    {
        if (requestid)
        { cancelAnimationFrame(requestid); }
        draw();
    };

    stopBtn.onclick = function ()
    {
        isStop = !isStop;
        if (isStop)
        {
            stopBtn.value = '播放';
        }
        else
        {
            stopBtn.value = '停止';
        }
    };

    function draw()
    {
        let numPoints = Number(input.value) + 1;
        if (isNaN(numPoints))
        { numPoints = 2; }
        numPoints = Math.max(1, Math.min(500, numPoints));

        let xs: number[] = [];
        let ys: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            xs[i] = Math.random();
            ys[i] = Math.random();
        }

        // 映射到画布坐标
        xs = xs.map((i) => i * canvas.width);
        ys = ys.map((i) => (1 - i) * canvas.height);

        const animations: {
            /**
             * x 坐标
             */
            x: number,
            /**
             * y 坐标
             */
            y: number,
            /**
             * x 过程数据
             */
            processsx: number[][],
            /**
             * y 过程数据
             */
            processsy: number[][]
        }[] = [];

        // 收集动画数据
        const num = 100;
        for (let i = 0; i <= num; i++)
        {
            const processsx: number[][] = [];
            const processsy: number[][] = [];
            const x = bezier.bn(i / num, xs, processsx);
            const y = bezier.bn(i / num, ys, processsy);

            animations[i] = { x, y, processsx, processsy };
        }

        let t = 0;
        let dir = 1;
        requestid = requestAnimationFrame(animation);
        requestAnimationFrame;

        const usecolors = getColors(xs.length);

        function animation()
        {
            //
            if (!isStop)
            { t += dir; }
            if (t > 100)
            {
                t = 100;
                dir = -1;
            }
            else if (t < 0)
            {
                t = 0;
                dir = 1;
            }
            clearCanvas(canvas);
            // 绘制插值过程
            const processsx = animations[t].processsx;
            const processsy = animations[t].processsy;
            for (let i = 0; i < processsx.length; i++)
            {
                drawPointsCurve(canvas, processsx[i], processsy[i], usecolors[i], 1);
            }
            requestid = requestAnimationFrame(animation);
            // 绘制整条曲线
            const xSamples = animations.map((i) => i.x);
            const ySamples = animations.map((i) => i.y);
            drawPointsCurve(canvas, xSamples, ySamples, 'green', 5);
            // 绘制曲线动画
            const txs = animations.map((i) => i.x).splice(0, t);
            const tys = animations.map((i) => i.y).splice(0, t);
            drawPointsCurve(canvas, txs, tys, 'red', 3);
        }
    }
})();
