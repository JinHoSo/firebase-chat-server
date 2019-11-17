export const roomIdGenerator = (): string => {
  return Date.now().toString()
}

export const messageIdGenerator = (): string => {
  return Date.now().toString()
}