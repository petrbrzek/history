import { canUseDOM } from './ExecutionEnvironment'
import runTransitionHook from './runTransitionHook'
import extractPath from './extractPath'
import parsePath from './parsePath'

function useBasename(createHistory) {
  return function (options={}) {
    let { basename, ...historyOptions } = options

    // Automatically use the value of <base href> in HTML
    // documents as basename if it's not explicitly given.
    if (basename == null && canUseDOM) {
      const base = document.getElementsByTagName('base')[0]

      if (base)
        basename = extractPath(base.href)
    }

    const history = createHistory(historyOptions)

    function addBasename(location) {
      if (basename && location.basename == null) {
        if (location.pathname.indexOf(basename) === 0) {
          location.pathname = location.pathname.substring(basename.length)
          location.basename = basename

          if (location.pathname === '')
            location.pathname = '/'
        } else {
          location.basename = ''
        }
      }

      return location
    }

    function prependBasename(location) {
      if (!basename)
        return location

      if (typeof location === 'string')
        location = parsePath(location)

      const pname = location.pathname
      const normalizedBasename = basename.slice(-1) === '/' ? basename : basename + '/'
      const normalizedPathname = pname.charAt(0) === '/' ? pname.slice(1) : pname
      const pathname = normalizedBasename + normalizedPathname

      return {
        ...location,
        pathname
      }
    }

    // Override all read methods with basename-aware versions.
    function listenBefore(hook) {
      return history.listenBefore(function (location, callback) {
        runTransitionHook(hook, addBasename(location), callback)
      })
    }

    function listen(listener) {
      return history.listen(function (location) {
        listener(addBasename(location))
      })
    }

    // Override all write/create methods with basename-aware versions.
    function push(location) {
      history.push(prependBasename(location))
    }

    function replace(location) {
      history.replace(prependBasename(location))
    }

    function createPath(location) {
      return history.createPath(prependBasename(location))
    }

    function createHref(location) {
      return history.createHref(prependBasename(location))
    }

    function createLocation() {
      return addBasename(history.createLocation.apply(history, arguments))
    }

    return {
      ...history,
      listenBefore,
      listen,
      push,
      replace,
      createPath,
      createHref,
      createLocation
    }
  }
}

export default useBasename
