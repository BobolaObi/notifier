const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');
const app = express();
const PORT = 3000;

// Enable CORS for all origins
app.use(cors());

// Create a cache instance with a TTL (time-to-live) of 10 minutes
const cache = new NodeCache({ stdTTL: 600 });

// Function to pre-fetch and cache all necessary data
const prefetchData = async () => {
  try {
    // Pre-fetch the first 20 coins data
    const allCoinsResponse = await axios.get('https://coincodex.com/apps/coincodex/cache/all_coins.json');
    const firstTwentyCoins = allCoinsResponse.data.slice(0, 20);
    cache.set('all_coins', firstTwentyCoins);
    console.log('First 20 coins data pre-fetched and cached.');

    // Add other data that you want to prefetch here if necessary
    // Example: Pre-fetch specific coins, market data, etc.
    const symbols = ['BTC', 'ETH', 'ADA'];
    for (const symbol of symbols) {
      const coinResponse = await axios.get(`https://coincodex.com/api/coincodex/get_coin/${symbol}`);
      cache.set(`coin_${symbol}`, coinResponse.data);
      console.log(`${symbol} data pre-fetched and cached.`);
    }
  } catch (error) {
    console.error('Error pre-fetching data:', error);
  }
};

// Home Page Endpoint: Display project information and API documentation links
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to My Crypto Project API</h1>
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

// Endpoint: Get all coins data (with caching)
app.get('/api/all_coins', async (req, res) => {
  const cacheKey = 'all_coins';
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const response = await axios.get('https://coincodex.com/apps/coincodex/cache/all_coins.json');
    cache.set(cacheKey, response.data); // Cache the response data
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching coin data');
  }
});

// Endpoint: Get specific coin details by symbol (with caching)
app.get("/coin/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const cacheKey = `coin_${symbol}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(`https://coincodex.com/api/coincodex/get_coin/${symbol}`);
    cache.set(cacheKey, response.data); // Cache the response data
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching coin details");
  }
});

// Endpoint: Get coin historical data (with caching)
app.get("/coin_history/:symbol/:start_date/:end_date/:samples", async (req, res) => {
  const { symbol, start_date, end_date, samples } = req.params;
  const cacheKey = `coin_history_${symbol}_${start_date}_${end_date}_${samples}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(`https://coincodex.com/api/coincodex/get_coin_history/${symbol}/${start_date}/${end_date}/${samples}`);
    cache.set(cacheKey, response.data); // Cache the response data
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching coin historical data");
  }
});

// Endpoint: Get market data for a specific coin (with caching)
app.get("/coin_markets/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const cacheKey = `coin_markets_${symbol}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(`https://coincodex.com/api/exchange/get_markets_by_coin/${symbol}`);
    cache.set(cacheKey, response.data); // Cache the response data
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching coin market data");
  }
});

// Endpoint: Get coin range data for multiple coins (with caching)
app.get("/coin_ranges/:symbols", async (req, res) => {
  const { symbols } = req.params;
  const cacheKey = `coin_ranges_${symbols}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(`https://coincodex.com/api/coincodex/get_coin_ranges/${symbols}`);
    cache.set(cacheKey, response.data); // Cache the response data
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching coin ranges");
  }
});

// Start the server after pre-fetching data
(async () => {
  await prefetchData();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();
