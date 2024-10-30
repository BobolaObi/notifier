const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Enable CORS for all origins
app.use(cors());

// Home Page Endpoint: Display project information and API documentation links
app.get('/', (req, res) => {
  res.send(`
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #121212;
        color: #e0e0e0;
        line-height: 1.6;
        margin: 0;
        padding: 20px;
      }
      h1 {
        color: #00bcd4;
        text-align: center;
      }
      p {
        text-align: center;
        font-size: 1.1em;
      }
      ul {
        list-style-type: none;
        padding: 0;
        max-width: 800px;
        margin: 20px auto;
      }
      li {
        background: #1e1e2f;
        margin: 10px;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
      a {
        color: #00bcd4;
        text-decoration: none;
        font-weight: bold;
      }
      a:hover {
        text-decoration: underline;
      }
      code {
        background: #333;
        padding: 2px 5px;
        border-radius: 4px;
        font-size: 0.9em;
        color: #e0e0e0;
      }
    </style>
    <h1>Welcome to My Crypto Project API - Built by Bobola Obi using CoinCodex API</h1>
    <p>This is a project to provide various cryptocurrency data through multiple endpoints. Below are the available API endpoints that you can call:</p>
    <ul>
      <li><strong>Get All Coins Data:</strong> <a href="/api/all_coins">/api/all_coins</a> - Fetches all coins data from CoinCodex.</li>
      <li><strong>Get Specific Coin Details:</strong> <a href="/coin/BTC">/coin/:symbol</a> - Fetches details of a specific coin by its symbol (e.g., <code>/coin/BTC</code>).</li>
      <li><strong>Get Coin Historical Data:</strong> <a href="/coin_history/BTC/2021-01-01/2021-12-31/100">/coin_history/:symbol/:start_date/:end_date/:samples</a> - Fetches historical data for a specific coin in a given date range and number of samples.</li>
      <li><strong>Get Market Data for a Coin:</strong> <a href="/coin_markets/BTC">/coin_markets/:symbol</a> - Fetches the market data for a specific coin.</li>
      <li><strong>Get Coin Range Data:</strong> <a href="/coin_ranges/BTC,ETH">/coin_ranges/:symbols</a> - Fetches range data for multiple coins (e.g., <code>/coin_ranges/BTC,ETH</code>).</li>
    </ul>
    <p>Replace the placeholders in the URLs with the appropriate symbols to get real data.</p>
  `);
});

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


// Serve privacy policy as a static file
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
