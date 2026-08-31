import app from './app'

const PORT = process.env.PORT ?? 4000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

setInterval(() => {
    // Keep alive
}, 1000 * 60 * 60);
