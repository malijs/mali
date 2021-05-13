import { Metadata } from '@grpc/grpc-js'
import lo from './lo.js'

export function create(metadata, { addEmpty } = { addEmpty: false }) {
  if (typeof metadata !== 'object') {
    return undefined
  }

  if (metadata instanceof Metadata) {
    return metadata
  }

  const meta = new Metadata()

  lo.forOwn(metadata, (v, k) => {
    if (Buffer.isBuffer(v)) {
      meta.add(k, v)
    } else if (v !== null && !lo.isUndefined(v)) {
      const toAdd = typeof v === 'string' ? v : v.toString()
      if (toAdd || addEmpty) {
        meta.add(k, toAdd)
      }
    }
  })

  return meta
}
