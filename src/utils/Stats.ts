import Stats1 from 'stats.js';
import { Component, RegisterComponent } from '../ecs/Component';

declare module '../ecs/Component'
{
    interface ComponentMap { Stats: Stats; }
}

@RegisterComponent({ name: 'Stats' })
export class Stats extends Component
{
    __class__: 'Stats';

    /**
     * @private
     */
    private _stats: Stats1;

    private _handle: number;

    /**
     * 是否自动更新。
     */
    isAuto = true;

    /**
     * 所在容器。
     */
    get container()
    {
        return this._container;
    }
    set container(v)
    {
        this._container = v;
        this._updateContainer();
    }

    private _updateContainer()
    {
        if (!this._stats) return;

        if (this._container)
        {
            this._container.appendChild(this._stats.dom);
        }
        else
        {
            document.body.appendChild(this._stats.dom);
        }
    }

    private _container: HTMLDivElement;

    init()
    {
        this._stats = new Stats1();
        this._updateContainer();

        if (this.isAuto)
        {
            this._handle = requestAnimationFrame(this.update.bind(this));
        }
    }

    update()
    {
        this._stats.update();

        if (this.isAuto)
        {
            this._handle = requestAnimationFrame(this.update.bind(this));
        }
    }

    dispose()
    {
        if (this._handle)
        {
            cancelAnimationFrame(this._handle);
        }

        document.body.removeChild(this._stats.dom);
        this._stats = null;

        super.dispose();
    }
}
