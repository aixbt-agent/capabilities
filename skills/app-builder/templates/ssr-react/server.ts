import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const port = Number(process.env.PORT || '__APP_PORT__')

const app = express()

app.get('/api/status', (_req, res) => {
  res.json({
    ok: true,
    app: '__APP_SUBDOMAIN__',
    ts: new Date().toISOString(),
  })
})

app.use(express.static(path.join(__dirname, 'dist')))
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(port, () => {
  console.log(`__APP_SUBDOMAIN__ listening on ${port}`)
})
