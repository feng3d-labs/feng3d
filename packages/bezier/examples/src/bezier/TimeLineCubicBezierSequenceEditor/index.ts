import { clearCanvas, createCanvas, drawPoints, drawPointsCurve } from '../../common/Common';
import { TimeLineCubicBezierKey, TimeLineCubicBezierSequence } from '../../common/TimeLineCubicBezierSequence';

(() =>
{
    // 基于时间的连续三阶Bézier曲线编辑，意味着一个x对应唯一的y

    // 创建画布
    const canvas = createCanvas(0, 60, window.innerWidth, window.innerHeight - 60);
    const canvaswidth = canvas.width;
    const canvasheight = canvas.height;

    // window.addEventListener("click", onMouseClick)
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('dblclick', ondblclick);

    const timeline = new TimeLineCubicBezierSequence();
    /**
     * 点绘制尺寸
     */
    const pointSize = 16;

    /**
     * 控制柄长度
     */
    const controllerLength = 100;

    //
    timeline.addKey({ t: Math.random(), y: Math.random(), tan: 0 });

    let editKey: TimeLineCubicBezierKey;
    let controlkey: TimeLineCubicBezierKey;
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

        editKey = timeline.findKey(x / canvaswidth, y / canvasheight, pointSize / canvasheight / 2);
        if (editKey === null)
        {
            controlkey = findControlPoint(x, y);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(ev: MouseEvent)
    {
        if (editKey === null && controlkey === null)
        { return; }
        editing = true;

        const rect = canvas.getBoundingClientRect();
        if (!(rect.left < ev.clientX && ev.clientX < rect.right && rect.top < ev.clientY && ev.clientY < rect.bottom))
        { return; }
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;

        if (editKey)
        {
            editKey.t = x / canvaswidth;
            editKey.y = y / canvasheight;
            timeline.sort();
        }
        else if (controlkey)
        {
            const index = timeline.indexOfKeys(controlkey);
            if (index === 0 && x / canvaswidth < controlkey.t)
            {
                controlkey.tan = y / canvasheight > controlkey.y ? Infinity : -Infinity;

                return;
            }
            if (index === timeline.numKeys - 1 && x / canvaswidth > controlkey.t)
            {
                controlkey.tan = y / canvasheight > controlkey.y ? -Infinity : Infinity;

                return;
            }
            controlkey.tan = (y / canvasheight - controlkey.y) / (x / canvaswidth - controlkey.t);
        }
    }

    function onMouseUp(_ev: MouseEvent)
    {
        editing = false;
        editKey = null;
        controlkey = null;

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    }

    function findControlPoint(x: number, y: number)
    {
        for (let i = 0; i < timeline.numKeys; i++)
        {
            const key = timeline.getKey(i);
            const currentx = key.t * canvaswidth;
            const currenty = key.y * canvasheight;
            const currenttan = key.tan * canvasheight / canvaswidth;
            const lcp = { x: currentx - controllerLength * Math.cos(Math.atan(currenttan)), y: currenty - controllerLength * Math.sin(Math.atan(currenttan)) };
            if (Math.abs(lcp.x - x) < pointSize / 2 && Math.abs(lcp.y - y) < pointSize / 2)
            {
                return key;
            }
            const rcp = { x: currentx + controllerLength * Math.cos(Math.atan(currenttan)), y: currenty + controllerLength * Math.sin(Math.atan(currenttan)) };
            if (Math.abs(rcp.x - x) < pointSize / 2 && Math.abs(rcp.y - y) < pointSize / 2)
            {
                return key;
            }
        }

        return null;
    }

    function ondblclick(ev: MouseEvent)
    {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        editing = false;
        editKey = null;
        controlkey = null;

        const rect = canvas.getBoundingClientRect();
        if (!(rect.left < ev.clientX && ev.clientX < rect.right && rect.top < ev.clientY && ev.clientY < rect.bottom))
        { return; }
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;

        const selectedKey = timeline.findKey(x / canvaswidth, y / canvasheight, pointSize / canvasheight / 2);
        if (selectedKey !== null)
        {
            timeline.deleteKey(selectedKey);
        }
        else
        {
            // 没有选中关键与控制点时，检查是否点击到曲线
            timeline.addKeyAtCurve(x / canvaswidth, y / canvasheight, pointSize / canvasheight / 2);
        }
    }

    requestAnimationFrame(draw);

    function draw()
    {
        clearCanvas(canvas);

        if (timeline.numKeys > 0)
        {
            const sameples = timeline.getSamples(canvaswidth);
            const xSamples = sameples.map((value, i) => canvaswidth * i / (sameples.length - 1));
            const ySamples = sameples.map((value) => canvasheight * value);
            // 绘制曲线
            drawPointsCurve(canvas, xSamples, ySamples, 'white', 3);
        }

        for (let i = 0, n = timeline.numKeys; i < n; i++)
        {
            const key = timeline.getKey(i);
            const currentx = key.t * canvaswidth;
            const currenty = key.y * canvasheight;
            const currenttan = key.tan * canvasheight / canvaswidth;

            // 绘制曲线端点
            drawPoints(canvas, [currentx], [currenty], 'red', pointSize);

            // 绘制控制点
            if (i > 0)
            {
                // 左边控制点
                const lcp = { x: currentx - controllerLength * Math.cos(Math.atan(currenttan)), y: currenty - controllerLength * Math.sin(Math.atan(currenttan)) };
                drawPoints(canvas, [lcp.x], [lcp.y], 'blue', pointSize);
            }
            if (i < n - 1)
            {
                const rcp = { x: currentx + controllerLength * Math.cos(Math.atan(currenttan)), y: currenty + controllerLength * Math.sin(Math.atan(currenttan)) };
                drawPoints(canvas, [rcp.x], [rcp.y], 'blue', pointSize);
            }
            // 绘制控制点
            if (i > 0)
            {
                // 左边控制点
                const lcp = { x: currentx - controllerLength * Math.cos(Math.atan(currenttan)), y: currenty - controllerLength * Math.sin(Math.atan(currenttan)) };
                drawPointsCurve(canvas, [currentx, lcp.x], [currenty, lcp.y], 'yellow', 1);
            }
            if (i < n - 1)
            {
                const rcp = { x: currentx + controllerLength * Math.cos(Math.atan(currenttan)), y: currenty + controllerLength * Math.sin(Math.atan(currenttan)) };
                drawPointsCurve(canvas, [currentx, rcp.x], [currenty, rcp.y], 'yellow', 1);
            }
        }
        //
        requestAnimationFrame(draw);
    }
})();
