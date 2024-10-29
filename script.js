const API_URL = "http://localhost:3000/api/all_coins";
const alertSound = document.getElementById("alertSound");
const stopSoundButton = document.getElementById("stopSound");

let allCoins = [];
let currentPage = 1;
const coinsPerPage = 10;
let selectedCoin = null;
let alertPrice = null;
let alertCondition = "above";
let alertInterval = null;
let alertSoundFile = "beep-07.mp3";
let alerts = [];


function searchCoins() {
    const searchTerm = document.getElementById("search-input").value.toLowerCase();

    // Filter coins by name or symbol based on the search term
    const filteredCoins = allCoins.filter(coin => {
        const coinName = coin.name ? coin.name.toLowerCase() : "";
        const coinSymbol = coin.symbol ? coin.symbol.toLowerCase() : "";
        return coinName.includes(searchTerm) || coinSymbol.includes(searchTerm);
    });

    displayFilteredCoins(filteredCoins);
}

// Helper function to display the filtered list of coins
function displayFilteredCoins(filteredCoins) {
    const coinsContainer = document.getElementById("coins-list");
    coinsContainer.innerHTML = "";

    filteredCoins.forEach(coin => {
        const coinName = coin.name || "Unknown Name";
        const coinSymbol = coin.symbol || "Unknown Symbol";
        const price = coin.last_price_usd !== undefined ? `$${parseFloat(coin.last_price_usd).toFixed(2)}` : "Price N/A";

        const coinDiv = document.createElement("div");
        coinDiv.classList.add("coin");
        coinDiv.onclick = () => selectMainCoin(coin);
        coinDiv.innerHTML = `<h3>${coinName} (${coinSymbol})</h3><p>Price: ${price}</p>`;

        coinsContainer.appendChild(coinDiv);
    });

    document.getElementById("page-info").innerText = `Showing ${filteredCoins.length} results`;
}


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

    // Set the coin details with defensive checks for null elements
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
            coinImageElement.src = `https://coincodex.com/images/coins/${coin.image_id}.png`;
            coinImageElement.style.display = "block";
        } else {
            coinImageElement.style.display = "none";
        }
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
        coinDiv.innerHTML = `<h3>${coinName} (${coinSymbol})</h3><p>Price: ${price}</p>`;

        coinsContainer.appendChild(coinDiv);
    });

    document.getElementById("page-info").innerText = `Page ${currentPage} of ${Math.ceil(allCoins.length / coinsPerPage)}`;
}


// Set a price alert
function setMainCoinAlert() {
    const priceInput = document.getElementById("alert-price").value;
    const conditionInput = document.getElementById("alert-condition").value;
    const soundInput = document.getElementById("alert-sound").value;

    if (selectedCoin && priceInput) {
        alertPrice = parseFloat(priceInput);
        alertCondition = conditionInput;
        alertSoundFile = soundInput;

        alerts.push({ coin: selectedCoin, price: alertPrice, condition: alertCondition, sound: alertSoundFile });
        alert(`Alert set for ${selectedCoin.name} at $${alertPrice} (${alertCondition})`);
    } else {
        alert("Please select a coin and enter a valid alert price.");
    }
}

// Check if the price meets the alert condition
async function checkMainCoinPrice() {
    if (selectedCoin && alertPrice) {
        try {
            const response = await fetch(`https://coincodex.com/api/coincodex/get_coin/${selectedCoin.symbol}`);
            const coinData = await response.json();
            const currentPrice = parseFloat(coinData.last_price_usd);

            document.getElementById("selected-coin-price").innerText = `$${currentPrice.toFixed(2)}`;

            let shouldTriggerAlert = false;

            switch (alertCondition) {
                case "above":
                    if (currentPrice > alertPrice) shouldTriggerAlert = true;
                    break;
                case "below":
                    if (currentPrice < alertPrice) shouldTriggerAlert = true;
                    break;
                case "equals":
                    if (currentPrice === alertPrice) shouldTriggerAlert = true;
                    break;
                case "above_equal":
                    if (currentPrice >= alertPrice) shouldTriggerAlert = true;
                    break;
                case "below_equal":
                    if (currentPrice <= alertPrice) shouldTriggerAlert = true;
                    break;
            }

            if (shouldTriggerAlert) {
                startAlertSound();
                alert(`${selectedCoin.name} has reached your alert price of $${currentPrice.toFixed(2)} (${alertCondition})!`);
                alertPrice = null; // Optionally, reset alert price after notification
            }
        } catch (error) {
            console.error("Error fetching coin price data:", error);
        }
    }
}

// Start playing alert sound
function startAlertSound() {
    alertSound.src = `https://www.soundjay.com/button/sounds/${alertSoundFile}`;
    alertSound.loop = true;
    alertSound.play();
    stopSoundButton.style.display = "block";
}

// Stop playing alert sound
function stopAlertSound() {
    alertSound.pause();
    alertSound.currentTime = 0;
    stopSoundButton.style.display = "none";
}

// Display alerts
function displayAlerts() {
    const alertsContainer = document.getElementById("alerts-list");
    alertsContainer.innerHTML = "";

    alerts.forEach(alert => {
        const alertDiv = document.createElement("div");
        alertDiv.classList.add("alert-item");
        alertDiv.innerHTML = `<p>Coin: ${alert.coin.name} (${alert.coin.symbol}) - Alert Price: $${alert.price.toFixed(2)} - Condition: ${alert.condition}</p>`;
        alertsContainer.appendChild(alertDiv);
    });
}

// Initial coin fetch and set interval to check the main coin's price every 5 minutes
fetchCoins();
setInterval(checkMainCoinPrice, 300000); // 5 minutes in milliseconds
