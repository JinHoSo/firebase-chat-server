import * as shortUUID from 'short-uuid'

export const roomIdGenerator = (): string => {
  return shortUUID.generate()
}

export const messageIdGenerator = (): string => {
  return shortUUID.generate()
}