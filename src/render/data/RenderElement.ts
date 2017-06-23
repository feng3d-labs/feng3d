namespace feng3d
{
    export class RenderElement extends EventDispatcher
    {
        public invalidate()
        {
            this.dispatchEvent(new Event(Event.CHANGE));
        }
    }
}