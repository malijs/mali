const grpc = require('@grpc/grpc-js')

/**
 * Utility helper function to create <code>Metadata</code> object from plain Javascript object
 * This strictly just calls <code>Metadata.add</code> with the key / value map of objects.
 * If the value is a <code>Buffer</code> it's passed as is.
 * If the value is a <code>Sting</code> it's passed as is.
 * Else if the value defined and not a string we simply call <code>toString()</code>.
 * Note that <code>Metadata</code> only accept string or buffer values.
 * @param  {Object} metadata Plain javascript object to tranform into <code>Metadata</code>
 *                           If an instance of <code>Metadata</code> is passed in it is simply returned
 * @return {Metadata} An instance of <code>Metadata</code>, or `undefined` if input is not an object
 */
function create (metadata) {
  if (typeof metadata !== 'object') {
    return
  }

  if (metadata instanceof grpc.Metadata) {
    return metadata
  }

  const meta = new grpc.Metadata()

  for (const k in metadata) {
    const v = metadata[k]
    if (Buffer.isBuffer(v)) {
      meta.add(k, v)
    } else if (v !== null && typeof v !== 'undefined') {
      const toAdd = typeof v === 'string' ? v : v.toString()
      if (toAdd) {
        meta.add(k, toAdd)
      }
    }
  }

  return meta
}

module.exports = { create }
