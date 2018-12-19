/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

export type Middleware<T> = (context: T, next: () => Promise<any>) => any;
export type ComposedMiddleware<T> = (context: T, next?: () => Promise<any>) => Promise<void>;

export function compose<T> (middleware: Array<Middleware<T>>): ComposedMiddleware<T> {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array.')
  
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions.')
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    // last called middleware #
    let index = -1

    return dispatch(0)

    function dispatch (i: number): Promise<any> {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))

      index = i

      let fn: Middleware<T> | undefined = middleware[i]

      if (i === middleware.length) fn = next

      if (!fn) return Promise.resolve()

      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
