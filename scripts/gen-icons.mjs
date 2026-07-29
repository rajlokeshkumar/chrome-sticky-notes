// Creates minimal valid PNGs using pure Node.js (no native deps)
import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'

mkdirSync('public', { recursive: true })

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const b of buf) {
    crc ^= b
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const t = Buffer.from(type)
  const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcVal])
}

function makePng(size, r, g, b) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB
  // compression, filter, interlace = 0

  // Raw image data: each row is filter byte (0) + RGB * width
  const raw = Buffer.alloc(size * (1 + size * 3))
  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 3)
    raw[row] = 0 // filter none
    for (let x = 0; x < size; x++) {
      raw[row + 1 + x * 3] = r
      raw[row + 1 + x * 3 + 1] = g
      raw[row + 1 + x * 3 + 2] = b
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// #89b4fa = rgb(137, 180, 250)
for (const size of [16, 48, 128]) {
  writeFileSync(`public/icon${size}.png`, makePng(size, 137, 180, 250))
  console.log(`icon${size}.png`)
}
