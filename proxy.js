// server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors());

// Create a cache instance with a TTL (time-to-live) of 10 minutes
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Function to pre-fetch specific important coins data
const prefetchImportantCoins = async () => {
  try {
    const symbols = ['BTC', 'ETH', 'ADA']; // Add other important symbols as needed
    for (const symbol of symbols) {
      const response = await axios.get(`https://coincodex.com/api/coincodex/get_coin/${symbol}`);
      cache.set(`coin_${symbol}`, response.data);
      console.log(`${symbol} data pre-fetched and cached.`);
    }
  } catch (error) {
    console.error('Error pre-fetching important coins:', error.message);
  }
};

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
    <h1>Welcome to My Crypto Project API</h1>
    <p>Built by Bobola Obi using CoinCodex API</p>
    <p>This project provides various cryptocurrency data through multiple endpoints. Below are the available API endpoints that you can call:</p>
    <ul>
      <li><strong>Get All Coins Data (Paginated):</strong> <a href="/api/all_coins">/api/all_coins</a> - Fetches all coins data from CoinCodex with pagination support.</li>
      <li><strong>Get Specific Coin Details:</strong> <a href="/coin/BTC">/coin/:symbol</a> - Fetches details of a specific coin by its symbol (e.g., <code>/coin/BTC</code>).</li>
      <li><strong>Get Coin Historical Data:</strong> <a href="/coin_history/BTC/2021-01-01/2021-12-31/100">/coin_history/:symbol/:start_date/:end_date/:samples</a> - Fetches historical data for a specific coin in a given date range and number of samples.</li>
      <li><strong>Get Market Data for a Coin:</strong> <a href="/coin_markets/BTC">/coin_markets/:symbol</a> - Fetches the market data for a specific coin.</li>
      <li><strong>Get Coin Range Data:</strong> <a href="/coin_ranges/BTC,ETH">/coin_ranges/:symbols</a> - Fetches range data for multiple coins (e.g., <code>/coin_ranges/BTC,ETH</code>).</li>
    </ul>
    <p>Replace the placeholders in the URLs with the appropriate symbols to get real data.</p>
  `);
});

// Endpoint: Get all coins data with pagination (with caching)
app.get('/api/all_coins', async (req, res) => {
  try {
    // Extract query parameters for pagination
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 20; // Default to 20 items per page

    // Generate a unique cache key based on page and limit
    const cacheKey = `all_coins_page_${page}_limit_${limit}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      console.log(`Serving /api/all_coins from cache (Page: ${page}, Limit: ${limit})`);
      return res.json(cachedData);
    }

    // Fetch all coins data from CoinCodex API
    const response = await axios.get('https://coincodex.com/apps/coincodex/cache/all_coins.json');
    const allCoins = response.data;

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCoins = allCoins.slice(startIndex, endIndex);

    // Prepare pagination metadata
    const totalPages = Math.ceil(allCoins.length / limit);
    const pagination = {
      totalItems: allCoins.length,
      totalPages: totalPages,
      currentPage: page,
      pageSize: limit,
    };

    // Combine paginated data with metadata
    const result = {
      pagination,
      data: paginatedCoins,
    };

    // Cache the paginated data
    cache.set(cacheKey, result);
    console.log(`Caching /api/all_coins (Page: ${page}, Limit: ${limit})`);

    res.json(result);
  } catch (error) {
    console.error('Error fetching all coins data:', error.message);
    res.status(500).send('Error fetching all coins data');
  }
});

// Endpoint: Get specific coin details by symbol (with caching)
app.get("/coin/:symbol", async (req, res) => {
  const { symbol } = req.params.toUpperCase();
  const cacheKey = `coin_${symbol}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`Serving /coin/${symbol} from cache`);
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(`https://coincodex.com/api/coincodex/get_coin/${symbol}`);
    cache.set(cacheKey, response.data); // Cache the response data
    console.log(`Caching /coin/${symbol}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching data for symbol ${symbol}:`, error.message);
    res.status(500).send(`Error fetching data for symbol ${symbol}`);
  }
});

// Endpoint: Get coin historical data (with caching)
app.get("/coin_history/:symbol/:start_date/:end_date/:samples", async (req, res) => {
  const { symbol, start_date, end_date, samples } = req.params.toUpperCase();
  const cacheKey = `coin_history_${symbol}_${start_date}_${end_date}_${samples}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`Serving /coin_history/${symbol}/${start_date}/${end_date}/${samples} from cache`);
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(`https://coincodex.com/api/coincodex/get_coin_history/${symbol}/${start_date}/${end_date}/${samples}`);
    cache.set(cacheKey, response.data); // Cache the response data
    console.log(`Caching /coin_history/${symbol}/${start_date}/${end_date}/${samples}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error.message);
    res.status(500).send(`Error fetching historical data for ${symbol}`);
  }
});

// Endpoint: Get market data for a specific coin (with caching)
app.get("/coin_markets/:symbol", async (req, res) => {
  const { symbol } = req.params.toUpperCase();
  const cacheKey = `coin_markets_${symbol}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`Serving /coin_markets/${symbol} from cache`);
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(`https://coincodex.com/api/exchange/get_markets_by_coin/${symbol}`);
    cache.set(cacheKey, response.data); // Cache the response data
    console.log(`Caching /coin_markets/${symbol}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error.message);
    res.status(500).send(`Error fetching market data for ${symbol}`);
  }
});

// Endpoint: Get coin range data for multiple coins (with caching)
app.get("/coin_ranges/:symbols", async (req, res) => {
  const { symbols } = req.params.toUpperCase();
  const cacheKey = `coin_ranges_${symbols}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`Serving /coin_ranges/${symbols} from cache`);
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(`https://coincodex.com/api/coincodex/get_coin_ranges/${symbols}`);
    cache.set(cacheKey, response.data); // Cache the response data
    console.log(`Caching /coin_ranges/${symbols}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching range data for symbols ${symbols}:`, error.message);
    res.status(500).send(`Error fetching range data for symbols ${symbols}`);
  }
});

// Start the server after pre-fetching important coins data
(async () => {
  await prefetchImportantCoins();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();
