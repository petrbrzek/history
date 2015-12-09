import deepEqual from 'deep-equal'
import { loopAsync } from './AsyncUtils'
import { PUSH, REPLACE, POP } from './Actions'
import runTransitionHook from './runTransitionHook'
import _createLocation from './createLocation'

function createRandomKey(length) {
  return Math.random().toString(36).substr(2, length)
}

function locationsAreEqual(a, b) {
  return a.pathname === b.pathname &&
    a.search === b.search &&
    //a.action === b.action && // Different action !== location change.
    a.key === b.key &&
    deepEqual(a.state, b.state)
}

const DefaultKeyLength = 6

function createHistory(options={}) {
  let { getCurrentLocation, finishTransition, go, keyLength, getUserConfirmation } = options

  if (typeof keyLength !== 'number')
    keyLength = DefaultKeyLength

  let transitionHooks = []

  function listenBefore(hook) {
    transitionHooks.push(hook)

    return function () {
      transitionHooks = transitionHooks.filter(item => item !== hook)
    }
  }

  let allKeys = []
  let changeListeners = []
  let location

  function getCurrent() {
    if (pendingLocation && pendingLocation.action === POP) {
      return allKeys.indexOf(pendingLocation.key)
    } else if (location) {
      return allKeys.indexOf(location.key)
    } else {
      return -1
    }
  }

  function updateLocation(newLocation) {
    let current = getCurrent()

    location = newLocation

    if (location.action === PUSH) {
      allKeys = [ ...allKeys.slice(0, current + 1), location.key ]
    } else if (location.action === REPLACE) {
      allKeys[current] = location.key
    }

    changeListeners.forEach(function (listener) {
      listener(location)
    })
  }

  function listen(listener) {
    changeListeners.push(listener)

    if (location) {
      listener(location)
    } else {
      let location = getCurrentLocation()
      allKeys = [ location.key ]
      updateLocation(location)
    }

    return function () {
      changeListeners = changeListeners.filter(item => item !== listener)
    }
  }

  function confirmTransitionTo(location, callback) {
    loopAsync(transitionHooks.length, function (index, next, done) {
      runTransitionHook(transitionHooks[index], location, function (result) {
        if (result != null) {
          done(result)
        } else {
          next()
        }
      })
    }, function (message) {
      if (getUserConfirmation && typeof message === 'string') {
        getUserConfirmation(message, function (ok) {
          callback(ok !== false)
        })
      } else {
        callback(message !== false)
      }
    })
  }

  let pendingLocation

  function transitionTo(nextLocation) {
    if (location && locationsAreEqual(location, nextLocation))
      return // Nothing to do.

    pendingLocation = nextLocation

    confirmTransitionTo(nextLocation, function (ok) {
      if (pendingLocation !== nextLocation)
        return // Transition was interrupted.

      if (ok) {
        // treat PUSH to current path like REPLACE to be consistent with browsers
        if (nextLocation.action === PUSH) {
          const prevPath = createPath(location)
          const nextPath = createPath(nextLocation)

          if (nextPath === prevPath)
            nextLocation.action = REPLACE
        }

        if (finishTransition(nextLocation) !== false)
          updateLocation(nextLocation)
      } else if (location && nextLocation.action === POP) {
        const prevIndex = allKeys.indexOf(location.key)
        const nextIndex = allKeys.indexOf(nextLocation.key)

        if (prevIndex !== -1 && nextIndex !== -1)
          go(prevIndex - nextIndex) // Restore the URL.
      }
    })
  }

  function push(location) {
    transitionTo(
      createLocation(location, PUSH, createKey())
    )
  }

  function replace(location) {
    transitionTo(
      createLocation(location, REPLACE, createKey())
    )
  }

  function goBack() {
    go(-1)
  }

  function goForward() {
    go(1)
  }

  function createKey() {
    return createRandomKey(keyLength)
  }

  function createPath(location) {
    if (location == null || typeof location === 'string')
      return location

    const { pathname, search, hash } = location
    let result = pathname

    if (search)
      result += search

    if (hash)
      result += hash

    return result
  }

  function createHref(location) {
    return createPath(location)
  }

  function createLocation(location, action, key=createKey()) {
    return _createLocation(location, action, key)
  }

  return {
    listenBefore,
    listen,
    transitionTo,
    push,
    replace,
    go,
    goBack,
    goForward,
    createKey,
    createPath,
    createHref,
    createLocation
  }
}

export default createHistory
