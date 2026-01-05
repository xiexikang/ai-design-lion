const getPassphrase = () => {
  const meta = typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: Record<string, string | undefined> }) : { env: {} }
  const env = meta.env || {}
  return env.VITE_APP_SECRET || 'lion-app-secret'
}

const textEncoder = new TextEncoder()

const toBase64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

const fromBase64 = (b64: string) => {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export const encryptString = async (text: string) => {
  const passphrase = getPassphrase()
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const baseKey = await crypto.subtle.importKey('raw', textEncoder.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
    const aesKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, textEncoder.encode(text))
    return {
      v: 2,
      method: 'aes-gcm',
      iv: toBase64(iv.buffer),
      salt: toBase64(salt.buffer),
      ciphertext: toBase64(ciphertext)
    }
  }
  const makeRand = (len: number) => {
    const arr = typeof crypto !== 'undefined' && crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(len)) : new Uint8Array(len).map(() => Math.floor(Math.random() * 256))
    return arr
  }
  const salt = makeRand(16)
  const keyStr = passphrase + ':' + toBase64(salt.buffer)
  const key = new TextEncoder().encode(keyStr)
  const data = new TextEncoder().encode(text)
  const S = new Uint8Array(256)
  for (let i = 0; i < 256; i++) S[i] = i
  let j = 0
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) & 255
    const tmp = S[i]
    S[i] = S[j]
    S[j] = tmp
  }
  const out = new Uint8Array(data.length)
  let i = 0
  j = 0
  for (let k = 0; k < data.length; k++) {
    i = (i + 1) & 255
    j = (j + S[i]) & 255
    const t = S[i]
    S[i] = S[j]
    S[j] = t
    const K = S[(S[i] + S[j]) & 255]
    out[k] = data[k] ^ K
  }
  return {
    v: 2,
    method: 'rc4',
    salt: toBase64(salt.buffer),
    ciphertext: toBase64(out.buffer)
  }
}

export const decryptString = async (payload: { v: number; method?: string; iv?: string; salt: string; ciphertext: string }) => {
  const passphrase = getPassphrase()
  if (payload.method === 'aes-gcm' && typeof crypto !== 'undefined' && crypto.subtle && payload.iv) {
    const iv = new Uint8Array(fromBase64(payload.iv))
    const salt = new Uint8Array(fromBase64(payload.salt))
    const baseKey = await crypto.subtle.importKey('raw', textEncoder.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
    const aesKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, fromBase64(payload.ciphertext))
    const dec = new TextDecoder()
    return dec.decode(decrypted)
  }
  const saltStr = payload.salt
  const salt = new Uint8Array(fromBase64(saltStr))
  const keyStr = passphrase + ':' + toBase64(salt.buffer)
  const key = new TextEncoder().encode(keyStr)
  const data = new Uint8Array(fromBase64(payload.ciphertext))
  const S = new Uint8Array(256)
  for (let i = 0; i < 256; i++) S[i] = i
  let j = 0
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) & 255
    const tmp = S[i]
    S[i] = S[j]
    S[j] = tmp
  }
  const out = new Uint8Array(data.length)
  let i = 0
  j = 0
  for (let k = 0; k < data.length; k++) {
    i = (i + 1) & 255
    j = (j + S[i]) & 255
    const t = S[i]
    S[i] = S[j]
    S[j] = t
    const K = S[(S[i] + S[j]) & 255]
    out[k] = data[k] ^ K
  }
  const dec = new TextDecoder()
  return dec.decode(out)
}

