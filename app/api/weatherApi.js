const axios = require("axios")

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")

  const { city } = req.query
  if (!city) return res.status(400).json({ error: "City is required" })

  try {
    const response = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          q: city,
          appid: process.env.WEATHER_API_KEY,
          units: "metric",
        },
      },
    )
    res.json(response.data)
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message)
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || "Server Error",
    })
  }
}
