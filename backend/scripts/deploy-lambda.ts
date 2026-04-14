import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { delimiter, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dir, '..')
const configPath = resolve(root, 'elysia-lambda.yaml')
const resolvedPath = resolve(root, '.elysia-lambda.resolved.yaml')
const binDir = resolve(root, 'node_modules', '.bin')
const deployCli = resolve(root, 'node_modules', 'danimai-elysia-lambda', 'deploy.mjs')

let raw = readFileSync(configPath, 'utf8')
raw = raw.replace(/\$\{env:([A-Za-z_][A-Za-z0-9_]*)\}/g, (full, name: string) => {
  const v = process.env[name]
  if (v == null || v === '') {
    console.error(`Missing or empty environment variable for placeholder ${full}: ${name}`)
    process.exit(1)
  }
  return v
})

writeFileSync(resolvedPath, raw)
let code = 1
try {
  const env = { ...process.env, PATH: `${binDir}${delimiter}${process.env.PATH ?? ''}` }
  const r = spawnSync('node', [deployCli, '--config', resolvedPath], {
    cwd: root,
    stdio: 'inherit',
    env,
  })
  if (r.error) {
    console.error(r.error)
    code = 1
  } else {
    code = r.status ?? 1
  }
} finally {
  try {
    unlinkSync(resolvedPath)
  } catch {
    /* ignore */
  }
}
process.exit(code)
