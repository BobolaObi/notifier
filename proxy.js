const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3000;


// Enable CORS for all origins
app.use(cors());


// Endpoint: Get all coins data
app.get('/api/all_coins', async (req, res) => {
  try {
      const response = await axios.get('https://coincodex.com/apps/coincodex/cache/all_coins.json');
      res.json(response.data);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Error fetching coin data');
  }
});

// Endpoint: Get specific coin details by symbol
app.get("/coin/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await axios.get(`https://coincodex.com/api/coincodex/get_coin/${symbol}`);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching coin details");
  }
});

// Endpoint: Get coin historical data
app.get("/coin_history/:symbol/:start_date/:end_date/:samples", async (req, res) => {
  const { symbol, start_date, end_date, samples } = req.params;
  try {
    const response = await axios.get(`https://coincodex.com/api/coincodex/get_coin_history/${symbol}/${start_date}/${end_date}/${samples}`);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching coin historical data");
  }
});

// Endpoint: Get market data for a specific coin
app.get("/coin_markets/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await axios.get(`https://coincodex.com/api/exchange/get_markets_by_coin/${symbol}`);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching coin market data");
  }
});

// Endpoint: Get coin range data for multiple coins
app.get("/coin_ranges/:symbols", async (req, res) => {
  const { symbols } = req.params;
  try {
    const response = await axios.get(`https://coincodex.com/api/coincodex/get_coin_ranges/${symbols}`);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching coin ranges");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});