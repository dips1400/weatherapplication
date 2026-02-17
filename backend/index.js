const express = require("express")
const axios = require("axios")
const cors = require("cors") // 1. Import CORS
require("dotenv").config()

const app = express()
const PORT = 5000

app.use(cors()) // 2. Enable CORS for all requests

const apiKey = process.env.WEATHER_API_KEY

app.get("/weatherApi", async (req, res) => {
  const city = req.query.city

  if (!city) {
    return res.status(400).json({ error: "City is required" })
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          q: city,
          appid: apiKey,
          units: "metric",
        },
      },
    )
    res.json(response.data)
  } catch (error) {
    console.error(
      "API Error:",
      error.response ? error.response.data : error.message,
    )
    res.status(error.response ? error.response.status : 500).json({
      error: error.response ? error.response.data.message : "Server Error",
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
