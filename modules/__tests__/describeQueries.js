import expect from 'expect'
import { PUSH, REPLACE, POP } from '../Actions'
import useQueries from '../useQueries'
import execSteps from './execSteps'

function stripHash(path) {
  return path.replace(/^#/, '')
}

function describeQueries(createHistory) {
  describe('default query serialization', function () {
    let history, unlisten
    beforeEach(function () {
      history = useQueries(createHistory)()
    })

    afterEach(function () {
      if (unlisten)
        unlisten()
    })

    describe('in push', function () {
      it('works', function (done) {
        const steps = [
          function (location) {
            expect(location.pathname).toEqual('/')
            expect(location.search).toEqual('')
            expect(location.query).toEqual({})
            expect(location.state).toEqual(null)
            expect(location.action).toEqual(POP)

            history.push({
              pathname: '/home',
              query: { the: 'query value' },
              state: { the: 'state' }
            })
          },
          function (location) {
            expect(location.pathname).toEqual('/home')
            expect(location.search).toEqual('?the=query+value')
            expect(location.query).toEqual({ the: 'query value' })
            expect(location.state).toEqual({ the: 'state' })
            expect(location.action).toEqual(PUSH)

            history.push({
              ...location,
              query: { other: 'query value' },
              state: { other: 'state' }
            })
          },
          function (location) {
            expect(location.pathname).toEqual('/home')
            expect(location.search).toEqual('?other=query+value')
            expect(location.query).toEqual({ other: 'query value' })
            expect(location.state).toEqual({ other: 'state' })
            expect(location.action).toEqual(PUSH)
          }
        ]

        unlisten = history.listen(execSteps(steps, done))
      })
    })

    describe('in replace', function () {
      it('works', function (done) {
        const steps = [
          function (location) {
            expect(location.pathname).toEqual('/')
            expect(location.search).toEqual('')
            expect(location.query).toEqual({})
            expect(location.state).toEqual(null)
            expect(location.action).toEqual(POP)

            history.replace({
              pathname: '/home',
              query: { the: 'query value' },
              state: { the: 'state' }
            })
          },
          function (location) {
            expect(location.pathname).toEqual('/home')
            expect(location.search).toEqual('?the=query+value')
            expect(location.query).toEqual({ the: 'query value' })
            expect(location.state).toEqual({ the: 'state' })
            expect(location.action).toEqual(REPLACE)

            history.replace({
              ...location,
              query: { other: 'query value' },
              state: { other: 'state' }
            })
          },
          function (location) {
            expect(location.pathname).toEqual('/home')
            expect(location.search).toEqual('?other=query+value')
            expect(location.query).toEqual({ other: 'query value' })
            expect(location.state).toEqual({ other: 'state' })
            expect(location.action).toEqual(REPLACE)
          }
        ]

        unlisten = history.listen(execSteps(steps, done))
      })
    })

    describe('in createPath', function () {
      it('works', function () {
        expect(
          history.createPath({
            pathname: '/the/path',
            query: { the: 'query value' }
          })
        ).toEqual('/the/path?the=query+value')
      })

      it('does not strip trailing slash', function () {
        expect(
          history.createPath({
            pathname: '/the/path/',
            query: { the: 'query value' }
          })
        ).toEqual('/the/path/?the=query+value')
      })

      describe('when the path contains a hash', function () {
        it('puts the query before the hash', function () {
          expect(
            history.createPath({
              pathname: '/the/path',
              hash: '#the-hash',
              query: { the: 'query value' }
            })
          ).toEqual('/the/path?the=query+value#the-hash')
        })
      })
    })

    describe('in createHref', function () {
      it('works', function () {
        expect(
          stripHash(history.createHref({
            pathname: '/the/path',
            query: { the: 'query value' }
          }))
        ).toEqual('/the/path?the=query+value')
      })
    })
  })

  describe('custom query serialization', function () {
    let history, unlisten
    beforeEach(function () {
      history = useQueries(createHistory)({
        parseQueryString() {
          return 'PARSE_QUERY_STRING'
        },
        stringifyQuery() {
          return 'STRINGIFY_QUERY'
        }
      })
    })

    afterEach(function () {
      if (unlisten)
        unlisten()
    })

    describe('in push', function () {
      it('works', function (done) {
        const steps = [
          function (location) {
            expect(location.pathname).toEqual('/')
            expect(location.search).toEqual('')
            expect(location.query).toEqual('PARSE_QUERY_STRING')
            expect(location.state).toEqual(null)
            expect(location.action).toEqual(POP)

            history.push({
              pathname: '/home',
              query: { the: 'query' },
              state: { the: 'state' }
            })
          },
          function (location) {
            expect(location.pathname).toEqual('/home')
            expect(location.search).toEqual('?STRINGIFY_QUERY')
            expect(location.query).toEqual('PARSE_QUERY_STRING')
            expect(location.state).toEqual({ the: 'state' })
            expect(location.action).toEqual(PUSH)
          }
        ]

        unlisten = history.listen(execSteps(steps, done))
      })
    })

    describe('in replace', function () {
      it('works', function (done) {
        const steps = [
          function (location) {
            expect(location.pathname).toEqual('/')
            expect(location.search).toEqual('')
            expect(location.query).toEqual('PARSE_QUERY_STRING')
            expect(location.state).toEqual(null)
            expect(location.action).toEqual(POP)

            history.replace({
              pathname: '/home',
              query: { the: 'query' },
              state: { the: 'state' }
            })
          },
          function (location) {
            expect(location.pathname).toEqual('/home')
            expect(location.search).toEqual('?STRINGIFY_QUERY')
            expect(location.query).toEqual('PARSE_QUERY_STRING')
            expect(location.state).toEqual({ the: 'state' })
            expect(location.action).toEqual(REPLACE)
          }
        ]

        unlisten = history.listen(execSteps(steps, done))
      })
    })

    describe('in createPath', function () {
      it('works', function () {
        expect(
          history.createPath({
            pathname: '/the/path',
            query: { the: 'query' }
          })
        ).toEqual('/the/path?STRINGIFY_QUERY')
      })

      it('does not strip trailing slash', function () {
        expect(
          history.createPath({
            pathname: '/the/path/',
            query: { the: 'query' }
          })
        ).toEqual('/the/path/?STRINGIFY_QUERY')
      })

      describe('when the path contains a hash', function () {
        it('puts the query before the hash', function () {
          expect(
            history.createPath({
              pathname: '/the/path',
              hash: '#the-hash',
              query: { the: 'query' }
            })
          ).toEqual('/the/path?STRINGIFY_QUERY#the-hash')
        })
      })
    })

    describe('in createHref', function () {
      it('works', function () {
        expect(
          stripHash(history.createHref({
            pathname: '/the/path',
            query: { the: 'query' }
          }))
        ).toEqual('/the/path?STRINGIFY_QUERY')
      })
    })
  })
}

export default describeQueries
