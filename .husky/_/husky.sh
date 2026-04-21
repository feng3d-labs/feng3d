#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - $1"
    fi
  }

  readonly hook_name="$(basename "$0")"
  debug "starting $hook_name..."

  if [ "$HUSKY" = "0" ]; then
    debug "HUSKY=0, skip hook"
    exit 0
  fi

  export readonly husky_skip_init=1
  sh -e "$0" "$@"
  exitCode="$?"

  if [ $exitCode != 0 ]; then
    debug "hook failed with code $exitCode"
    exit $exitCode
  fi

  debug "hook succeeded"
  exit 0
fi
