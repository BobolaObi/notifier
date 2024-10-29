const API_URL = "http://localhost:3000/api/all_coins";
const alertSound = document.getElementById("alertSound");
const stopSoundButton = document.getElementById("stopSound");

let allCoins = [];
let currentPage = 1;
const coinsPerPage = 10;
let selectedCoin = null;
let alertPrice = null;
let alertCondition = "above";
let alertSoundFile = "beep-07.mp3";
let alerts = [];

// Fetch coins and display the default selected coin
async function fetchCoins() {
    try {
        console.log("Fetching coins...");
        const response = await fetch(API_URL);
        allCoins = await response.json();

        // Check the type of allCoins to ensure it's an array
        if (!Array.isArray(allCoins)) {
            console.error("API did not return an array as expected:", allCoins);
            return;
        }

        console.log(allCoins); // Log the full response for debugging

        // Automatically select the default coin when the page loads
        selectDefaultCoin();
        displayCoins();
    } catch (error) {
        console.error("Error fetching coin data:", error);
    }
}

// Show and hide different page sections
function showDefaultCoinPage() {
    document.getElementById("default-coin").style.display = "block";
    document.getElementById("search-coin").style.display = "none";
    document.getElementById("alerts-page").style.display = "none";
}

function showSearchPage() {
    document.getElementById("default-coin").style.display = "none";
    document.getElementById("search-coin").style.display = "block";
    document.getElementById("alerts-page").style.display = "none";
}

function showAlertsPage() {
    document.getElementById("default-coin").style.display = "none";
    document.getElementById("search-coin").style.display = "none";
    document.getElementById("alerts-page").style.display = "block";
    displayAlerts();
}

// Select the default coin
function selectDefaultCoin() {
    const defaultCoinSymbol = "BLS5";
    const defaultCoin = allCoins.find(coin => coin.symbol === defaultCoinSymbol);

    if (defaultCoin) {
        selectMainCoin(defaultCoin);
    } else {
        console.log(`Default coin with symbol ${defaultCoinSymbol} not found.`);
    }
}

// Function to set the selected coin in the main display
function selectMainCoin(coin) {
    selectedCoin = coin;

    // Set the coin details
    const coinNameElement = document.getElementById("selected-coin-name");
    const coinPriceElement = document.getElementById("selected-coin-price");
    const coinRankElement = document.getElementById("selected-coin-rank");
    const coinVolumeElement = document.getElementById("selected-coin-volume");
    const coinImageElement = document.getElementById("selected-coin-image");

    if (coinNameElement) {
        coinNameElement.innerText = `${coin.name || "Unknown"} (${coin.symbol || "Unknown"})`;
    }

  

    if (coinPriceElement) {
        coinPriceElement.innerText = coin.last_price_usd ? `$${parseFloat(coin.last_price_usd).toFixed(2)}` : "Price N/A";
    }

    if (coinRankElement) {
        coinRankElement.innerText = coin.market_cap_rank ? `#${coin.market_cap_rank}` : "N/A";
    }

    if (coinVolumeElement) {
        coinVolumeElement.innerText = coin.volume_24_usd ? `$${parseFloat(coin.volume_24_usd).toFixed(2)}` : "N/A";
    }




    if (coinImageElement) {
        if (coin.image_id) {
            // Assuming image URL follows this pattern
            // coinImageElement.src = `https://coincodex.com/images/coins/${coin.image_id}.png`;
            coinImageElement.src = `https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${coin.image_id}/coin64`;

            coinImageElement.style.display = "block";
        } else {
            coinImageElement.style.display = "none";
        }
    }

    // Automatically navigate to the Default Coin Page
    showDefaultCoinPage();

    // Set an interval to update the price every 10 seconds
    setInterval(() => {
        updateCoinPrice(coin.symbol);
    }, 10000);
}

// Update the coin price every 10 seconds
async function updateCoinPrice(symbol) {
    try {
        const response = await fetch(`https://coincodex.com/api/coincodex/get_coin/${symbol}`);
        const coinData = await response.json();
        const currentPrice = parseFloat(coinData.last_price_usd);

        document.getElementById("selected-coin-price").innerText = `$${currentPrice.toFixed(2)}`;
    } catch (error) {
        console.error("Error updating coin price:", error);
    }
}

// Display all coins
function displayCoins() {
    const coinsContainer = document.getElementById("coins-list");
    coinsContainer.innerHTML = "";

    const start = (currentPage - 1) * coinsPerPage;
    const end = start + coinsPerPage;
    const currentCoins = allCoins.slice(start, end);

    currentCoins.forEach(coin => {
        const coinName = coin.name || "Unknown Name";
        const coinSymbol = coin.symbol || "Unknown Symbol";
        const price = coin.last_price_usd !== undefined ? `$${parseFloat(coin.last_price_usd).toFixed(2)}` : "Price N/A";

        const coinDiv = document.createElement("div");
        coinDiv.classList.add("coin");
        coinDiv.onclick = () => selectMainCoin(coin);
        coinDiv.innerHTML = `
            <div class="coin-card">
                <img class="coin-image" src="https://coincodex.com/images/coins/${coin.image_id}.png" alt="${coin.name} Image">
                <h3>${coinName} (${coinSymbol})</h3>
                <p>Price: ${price}</p>
            </div>`;

        coinsContainer.appendChild(coinDiv);
    });

    document.getElementById("page-info").innerText = `Page ${currentPage} of ${Math.ceil(allCoins.length / coinsPerPage)}`;
}

// Initial coin fetch and set interval to check the main coin's price every 5 minutes
fetchCoins();
