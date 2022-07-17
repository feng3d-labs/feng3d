namespace feng3d
{

    // The interface to get time information from Unity.
    export class Time
    {
        // The time this frame has started (RO). This is the time in seconds since the start of the game.
        static get time(): number
        {
            throw `未实现`;
        }

        // The time this frame has started (RO). This is the time in seconds since the start of the game. Double precision version of time, please prefer to use it instead of single precision (float).
        static get timeAsDouble()
        {
            return Time.time;
        }

        // The time this frame has started (RO). This is the time in seconds since the last level has been loaded.
        static get timeSinceLevelLoad(): number
        {
            throw `未实现`;
        }

        // The time this frame has started (RO). This is the time in seconds since the last level has been loaded. Double precision version of timeSinceLevelLoad, please prefer to use it instead of single precision (float).
        static get timeSinceLevelLoadAsDouble()
        {
            return Time.timeSinceLevelLoad;
        }

        // The time in seconds it took to complete the last frame (RO).
        static get deltaTime(): number
        {
            throw `未实现`;
        }

        // The time the latest MonoBehaviour::pref::FixedUpdate has started (RO). This is the time in seconds since the start of the game.
        static get fixedTime(): number
        {
            throw `未实现`;
        }

        // The time the latest MonoBehaviour::pref::FixedUpdate has started (RO). This is the time in seconds since the start of the game.
        // Double precision version of unscaledTime, please prefer to use it instead of single precision (float).
        static get fixedTimeAsDouble()
        {
            return Time.fixedTime;
        }

        // The cached real time (realTimeSinceStartup) at the start of this frame
        static get unscaledTime(): number
        {
            throw `未实现`;
        }

        // The cached real time (realTimeSinceStartup) at the start of this frame. Double precision version of unscaledTime, please prefer to use it instead of single precision (float).
        static get unscaledTimeAsDouble()
        {
            return Time.unscaledTime;
        }

        // The real time corresponding to this fixed frame
        static get fixedUnscaledTime(): number
        {
            throw `未实现`;
        }

        // The real time corresponding to this fixed frame. Double precision version of unscaledTime, please prefer to use it instead of single precision (float).
        static get fixedUnscaledTimeAsDouble()
        {
            return Time.fixedUnscaledTime;
        }

        // The delta time based upon the realTime
        static get unscaledDeltaTime(): number
        {
            throw `未实现`;
        }

        // The delta time based upon the realTime
        static get fixedUnscaledDeltaTime()
        {
            throw `未实现`;
        }

        // The interval in seconds at which physics and other fixed frame rate updates (like MonoBehaviour's MonoBehaviour::pref::FixedUpdate) are performed.
        static fixedDeltaTime: number;

        // The maximum time a frame can take. Physics and other fixed frame rate updates (like MonoBehaviour's MonoBehaviour::pref::FixedUpdate)
        static maximumDeltaTime: number;

        // A smoothed out Time.deltaTime (RO).
        static get smoothDeltaTime(): number
        {
            throw `未实现`;
        }

        // The maximum time a frame can spend on particle updates. If the frame takes longer than this, then updates are split into multiple smaller updates.
        static maximumParticleDeltaTime: number;

        // The scale at which the time is passing. This can be used for slow motion effects.
        static timeScale: number;

        // The total number of frames that have passed (RO).
        static get frameCount(): number
        {
            throw `未实现`;
        }

        // *undocumented*
        static get renderedFrameCount(): number
        {
            throw `未实现`;
        }

        // The real time in seconds since the game started (RO).
        static get realtimeSinceStartup(): number
        {
            throw `未实现`;
        }

        // The real time in seconds since the game started (RO). Double precision version of realtimeSinceStartup, please prefer to use it instead of single precision (float).
        static get realtimeSinceStartupAsDouble()
        {
            return Time.realtimeSinceStartup;
        }

        // If /captureDeltaTime/ is set to a value larger than 0, time will advance by that increment.
        static captureDeltaTime: number;

        // /captureFramerate/ is a convenience (and backwards compatible) accessor for the reciprocal of /captureDeltaTime/ rounded to the nearest integer.
        static get captureFramerate()
        {
            return Time.captureDeltaTime === 0.0 ? 0 : Math.round(1.0 / Time.captureDeltaTime);
        }

        static set captureFramerate(value)
        {
            Time.captureDeltaTime = value === 0 ? 0.0 : 1.0 / value;
        }

        // Returns true if inside a fixed time step callback such as FixedUpdate, otherwise false.
        static get inFixedTimeStep(): boolean
        {
            throw `未实现`;
        }
    }
}