import { MapUtils } from 'feng3d';

class Cursor
{
    private o = new Map<any, 'e-resize' | 'n-resize'>();

    add(id: any, value: 'e-resize' | 'n-resize')
    {
        this.o.set(id, value);
        this.update();
    }

    clear(id: any)
    {
        this.o.delete(id);
        this.update();
    }

    private update()
    {
        const v = MapUtils.getValues(this.o).reverse()[0];
        document.body.style.cursor = v || 'auto';
    }
}
/**
 * 鼠标光标管理
 */
export const cursor = new Cursor();
