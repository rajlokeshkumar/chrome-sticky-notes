const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function nanoid(len = 10) {
  let id = ''
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  arr.forEach(b => { id += CHARS[b % CHARS.length] })
  return id
}
