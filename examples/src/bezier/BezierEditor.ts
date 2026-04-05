import { bezier } from 'feng3d';
import { clearCanvas, createCanvas, drawPoints, drawPointsCurve } from './Common';

(() =>
{
    // 创建画布
    const canvas = createCanvas(0, 60, window.innerWidth, window.innerHeight - 60);

    // window.addEventListener("click", onMouseClick)
    window.addEventListener('mousedown', onMouseDown);

    const xs: number[] = [Math.random() * canvas.width, Math.random() * canvas.width, Math.random() * canvas.width];
    const ys: number[] = [Math.random() * canvas.height, Math.random() * canvas.height, Math.random() * canvas.height];
    let editIndex = -1;
    let editing = false;
    const mousedownxy = { x: -1, y: -1 };

    function onMouseDown(ev: MouseEvent)
    {
        const rect = canvas.getBoundingClientRect();
        if (!(rect.left < ev.clientX && ev.clientX < rect.right && rect.top < ev.clientY && ev.clientY < rect.bottom))
        { return; }
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;

        mousedownxy.x = x;
        mousedownxy.y = y;

        editIndex = findPoint(x, y);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(ev: MouseEvent)
    {
        if (editIndex === -1)
        { return; }
        editing = true;

        const rect = canvas.getBoundingClientRect();
        if (!(rect.left < ev.clientX && ev.clientX < rect.right && rect.top < ev.clientY && ev.clientY < rect.bottom))
        { return; }
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;

        xs[editIndex] = x;
        ys[editIndex] = y;
    }

    function onMouseUp(ev: MouseEvent)
    {
        if (editing)
        {
            editing = false;
            editIndex = -1;

            return;
        }
        const rect = canvas.getBoundingClientRect();
        if (!(rect.left < ev.clientX && ev.clientX < rect.right && rect.top < ev.clientY && ev.clientY < rect.bottom))
        {
            return;
        }
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;

        if (Math.abs(mousedownxy.x - x) > 5 || Math.abs(mousedownxy.y - y) > 5)
        {
            // 有移动鼠标，无效点击
            return;
        }

        const index = findPoint(x, y);
        if (index !== -1)
        {
            deletePoint(index);
        }
        else
        {
            addPoint(x, y);
        }

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    }

    function findPoint(x: number, y: number)
    {
        for (let i = 0; i < xs.length; i++)
        {
            if (Math.abs(xs[i] - x) < 5 && Math.abs(ys[i] - y) < 20)
            {
                return i;
            }
        }

        return -1;
    }

    function deletePoint(index: number)
    {
        xs.splice(index, 1);
        ys.splice(index, 1);
    }

    function addPoint(x: number, y: number)
    {
        xs.push(x);
        ys.push(y);
    }

    requestAnimationFrame(draw);

    function draw()
    {
        clearCanvas(canvas);

        if (xs.length > 0)
        {
            // 使用 bezierCurve 进行采样曲线点
            const xSamples = bezier.getSamples(xs);
            const ySamples = bezier.getSamples(ys);
            // 绘制曲线
            drawPointsCurve(canvas, xSamples, ySamples, 'white', 3);

            // 绘制起点
            drawPoints(canvas, xs.slice(0, 1), ys.slice(0, 1), 'red', 16);

            // 绘制控制点
            if (xs.length > 2)
            {
                drawPoints(canvas, xs.slice(1, xs.length - 1), ys.slice(1, ys.length - 1), 'blue', 16);
            }

            // 绘制终点
            if (xs.length > 1)
            {
                drawPoints(canvas, xs.slice(xs.length - 1, xs.length), ys.slice(ys.length - 1, ys.length), 'green', 16);
            }

            // 绘制控制点之间的连线
            if (xs.length > 2)
            {
                drawPointsCurve(canvas, xs, ys, 'yellow', 1);
            }
        }
        //
        requestAnimationFrame(draw);
    }
})();
