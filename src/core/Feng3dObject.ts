namespace feng3d
{
    // export type Type = new () => Feng3dObject;
    export type Type<T extends Feng3dObject> = new () => T;

    /**
     * Base class for all objects feng3d can reference.
     * 
     * Any variable you make that derives from Feng3dObject gets shown in the inspector as a drop target, allowing you to set the value from the GUI.
     */
    export class Feng3dObject extends EventDispatcher
    {
        //------------------------------------------
        // Variables
        //------------------------------------------
        /**
         * Should the Feng3dObject be hidden, saved with the scene or modifiable by the user?
         */
        hideFlags: HideFlags;

        //------------------------------------------
        // Functions
        //------------------------------------------
        constructor()
        {
            super();
        }

        /**
         * Removes a gameobject, component or asset.
         * @param obj	The Feng3dObject to destroy.
         * @param t	    The optional amount of time to delay before destroying the Feng3dObject.
         */
        static destroy(obj: Feng3dObject, t = 0)
        {

        }

        /**
         * Destroys the Feng3dObject obj immediately.
         * @param obj	                    Feng3dObject to be destroyed.
         * @param allowDestroyingAssets	    Set to true to allow assets to be destoyed.
         */
        static destroyImmediate(obj: Feng3dObject, allowDestroyingAssets = false)
        {

        }

        /**
         * Makes the Feng3dObject target not be destroyed automatically when loading a new scene.
         */
        static dontDestroyOnLoad(target: Feng3dObject)
        {

        }

        /**
         * Returns the first active loaded Feng3dObject of Type type.
         */
        static findObjectOfType<T extends Feng3dObject>(type: Type<T>): T | null
        {
            return null;
        }

        /**
         * Returns a list of all active loaded objects of Type type.
         */
        static findObjectsOfType<T extends Feng3dObject>(type: Type<T>): T[] | null
        {
            return null;
        }

        /**
         * Returns a copy of the Feng3dObject original.
         * @param original	An existing Feng3dObject that you want to make a copy of.
         * @param position	Position for the new Feng3dObject(default Vector3.zero).
         * @param rotation	Orientation of the new Feng3dObject(default Quaternion.identity).
         * @param parent	The transform the Feng3dObject will be parented to.
         * @param worldPositionStays	If when assigning the parent the original world position should be maintained.
         */
        static instantiate<T extends Feng3dObject>(original: T, position?: Vector3, rotation?: Quaternion, parent?: Transform, worldPositionStays = false): T | null
        {
            return null;
        }
    }
}