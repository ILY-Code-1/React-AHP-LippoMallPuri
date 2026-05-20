/**
 * CLI: encrypt a Firebase config JSON into the value for the SECRET env var.
 *
 * Usage:
 *   npm run encrypt-env -- path/to/firebase-config.json
 *   npm run encrypt-env                 (then paste JSON, end with Ctrl+Z + Enter on Windows / Ctrl+D on Unix)
 *
 * Output: a single encrypted string. Paste it into `.env` as:  SECRET=<string>
 */
import { readFileSync } from 'node:fs'
import { encryptConfig } from '../src/lib/crypto.js'

const readStdin = () =>
  new Promise((resolve) => {
    let buf = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => (buf += chunk))
    process.stdin.on('end', () => resolve(buf))
  })

const main = async () => {
  const fileArg = process.argv[2]
  let raw

  if (fileArg) {
    raw = readFileSync(fileArg, 'utf8')
  } else {
    console.error('Paste your Firebase config JSON, then press Ctrl+Z + Enter (Windows) / Ctrl+D (Unix):\n')
    raw = await readStdin()
  }

  let config
  try {
    config = JSON.parse(raw)
  } catch {
    console.error('\n✗ Input is not valid JSON. Aborting.')
    process.exit(1)
  }

  const required = ['apiKey', 'authDomain', 'projectId', 'appId']
  const missing = required.filter((k) => !config[k])
  if (missing.length) {
    console.error(`\n⚠  Warning: config is missing keys: ${missing.join(', ')}`)
  }

  const encrypted = encryptConfig(config)

  console.log('\n──────────────────────────────────────────────')
  console.log('Copy the line below into your .env file:\n')
  console.log(`SECRET=${encrypted}`)
  console.log('──────────────────────────────────────────────\n')
}

main()
