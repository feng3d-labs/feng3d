namespace feng3d
{
    /**
     * Base class for all objects feng3d can reference.
     * 
     * Any variable you make that derives from Feng3dObject gets shown in the inspector as a drop target, allowing you to set the value from the GUI.
     */
    export class Feng3dObject extends EventDispatcher
    {

        value(v: gPartial<this>)
        {
            feng3d.serialization.setValue(this, <any>v);
            return this;
        }
    }
}