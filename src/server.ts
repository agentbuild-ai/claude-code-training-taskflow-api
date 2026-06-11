import app from './app'
import { initSchema } from './db'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

initSchema()

app.listen(PORT, () => {
  console.log(`TaskFlow API running on http://localhost:${PORT}`)
})
