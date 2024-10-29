const API_URL = "http://localhost:3000/api/all_coins";
const alertSound = document.getElementById("alertSound");
const stopSoundButton = document.getElementById("stopSound");

let allCoins = [];
let favoriteCoins = [];
let currentPage = 1;
const coinsPerPage = 10;
let selectedCoin = null;
let alertPrice = null;
let alertCondition = "above";
let alertSoundFile = "beep-07.mp3";
let alerts = [];
let cachedSearchResults = {};

// Fetch coins on load
async function fetchCoins() {
    try {
        console.log("Fetching coins...");
        let response = await fetch(API_URL);
        allCoins = await response.json();
        if (!Array.isArray(allCoins)) {
            console.error("API did not return an array as expected:", allCoins);
            return;
        }
        console.log(allCoins);
        loadFavoritesFromLocalStorage();
        loadAlertsFromLocalStorage();
        selectDefaultCoin();
        displayCoins();
        updateAlertCount();
    } catch (error) {
        console.error("Error fetching coin data:", error);
    }
}

// Show different pages
function showDefaultCoinPage() {
    document.getElementById("default-coin").style.display = "block";
    document.getElementById("search-coin").style.display = "none";
    document.getElementById("alerts-page").style.display = "none";
    displayFavoriteCoins();
}

function showSearchPage() {
    document.getElementById("default-coin").style.display = "none";
    document.getElementById("search-coin").style.display = "block";
    document.getElementById("alerts-page").style.display = "none";
    displayCoins();
}

function showAlertsPage() {
    document.getElementById("default-coin").style.display = "none";
    document.getElementById("search-coin").style.display = "none";
    document.getElementById("alerts-page").style.display = "block";
    displayAlerts();
}

// Select default coin
function selectDefaultCoin() {
    let defaultSymbol = "BLS5";
    let defaultCoin = allCoins.find(coin => coin.symbol === defaultSymbol);
    if (defaultCoin) {
        addFavoriteCoin(null, defaultCoin.symbol, true);
    } else {
        console.log(`Default coin with symbol ${defaultSymbol} not found.`);
    }
}

// Select main coin to display details
function selectMainCoin(coin) {
    selectedCoin = coin;

    let nameElem = document.getElementById("selected-coin-name");
    let priceElem = document.getElementById("selected-coin-price");
    let rankElem = document.getElementById("selected-coin-rank");
    let volumeElem = document.getElementById("selected-coin-volume");
    let imageElem = document.getElementById("selected-coin-image");

    nameElem.innerText = `${coin.name || "Unknown"} (${coin.symbol || "Unknown"})`;
    priceElem.innerText = formatPrice(coin.last_price_usd);
    rankElem.innerText = coin.market_cap_rank ? `#${coin.market_cap_rank}` : "N/A";
    volumeElem.innerText = coin.volume_24_usd ? `${formatPrice(coin.volume_24_usd)}` : "N/A";

    if (coin.image_id) {
        imageElem.src = `https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${coin.image_id}/coin64`;
        imageElem.style.display = "block";
    } else {
        imageElem.style.display = "none";
    }

    showDefaultCoinPage();
}


// Pagination functions
function nextPage() {
    if (coinsPerPage * currentPage < allCoins.length) {
        currentPage++;
        displayCoins();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayCoins();
    }
}

function displayCoins() {
    let coinsList = document.getElementById("coins-list");
    coinsList.innerHTML = "";

    let start = (currentPage - 1) * coinsPerPage;
    let paginatedCoins = allCoins.slice(start, start + coinsPerPage);

    paginatedCoins.forEach(coin => {
        let name = coin.name || "Unknown Name";
        let symbol = coin.symbol || "Unknown Symbol";
        let price = formatPrice(coin.last_price_usd);

        let coinCard = document.createElement("div");
        coinCard.classList.add("coin-card");
        coinCard.onclick = () => selectMainCoin(coin);
        coinCard.innerHTML = `
            <div style="margin-bottom: 15px;">
                <img class="coin-image" src="https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${coin.image_id}/coin64" alt="${coin.name} Image" style="width: 64px; height: 64px;">
                <h3>${name} (${symbol})</h3>
                <p>Price: ${price}</p>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 10px;">
                <button style="
                    flex: 1;
                    background-color: tomato;
                    color: white;
                    border: none;
                    padding: 8px 0;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9em;
                " onclick="addFavoriteCoin(event, '${coin.symbol}')">⭐ Add to Favorites</button>
                <button style="
                    flex: 1;
                    background-color: tomato;
                    color: white;
                    border: none;
                    padding: 8px 0;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9em;
                " onclick="viewAlerts(event, '${coin.symbol}')">🔔 View Alerts</button>
                <button style="
                    flex: 1;
                    background-color: tomato;
                    color: white;
                    border: none;
                    padding: 8px 0;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9em;
                " onclick="editAlerts(event, '${coin.symbol}')">✏️ Edit Alerts</button>
            </div>
        `;
        coinsList.appendChild(coinCard);
    });

    document.getElementById("page-info").innerText = `Page ${currentPage} of ${Math.ceil(allCoins.length / coinsPerPage)}`;
}


// Helper function to format prices
function formatPrice(price) {
    const floatPrice = parseFloat(price);
    if (isNaN(floatPrice)) {
        return "Price N/A";
    }
    if (floatPrice >= 1) {
        return `$${floatPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
        return `$${floatPrice.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
    }
}

// Add favorite coin
function addFavoriteCoin(event, symbol, isDefault = false) {
    if (event) event.stopPropagation();
    let coin = allCoins.find(c => c.symbol === symbol);
    if (coin && !favoriteCoins.some(c => c.symbol === coin.symbol)) {
        if (isDefault) {
            // Place default coin at the beginning
            favoriteCoins.unshift(coin);
        } else {
            favoriteCoins.push(coin);
        }
        saveFavoritesToLocalStorage();
        displayFavoriteCoins();
    }
}

// Updated displayFavoriteCoins function with Remove button
function displayFavoriteCoins() {
    let favoritesList = document.getElementById("favorite-coins-list");
    favoritesList.innerHTML = "";

    if (favoriteCoins.length === 0) {
        favoritesList.innerHTML = "<p>No favorite coins added yet.</p>";
        return;
    }

    favoriteCoins.forEach(coin => {
        let name = coin.name || "Unknown Name";
        let symbol = coin.symbol || "Unknown Symbol";
        let price = formatPrice(coin.last_price_usd);

        let coinCard = document.createElement("div");
        coinCard.classList.add("coin-card");
        coinCard.onclick = () => selectMainCoin(coin);
        coinCard.innerHTML = `
            <div style="margin-bottom: 15px;">
                <img class="coin-image" src="https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${coin.image_id}/coin64" alt="${coin.name} Image" style="width: 64px; height: 64px;">
                <h3>${name} (${symbol})</h3>
                <p>Price: ${price}</p>
            </div>
            <div class="buttons-container">
                <button onclick="setAsDefaultCoin(event, '${coin.symbol}')">🔄 Set as Default</button>
                <button onclick="viewAlerts(event, '${coin.symbol}')">🔔 View Alerts</button>
                <button onclick="editAlerts(event, '${coin.symbol}')">✏️ Edit Alerts</button>
                <button onclick="removeFavoriteCoin(event, '${coin.symbol}')">🗑️ Remove</button>
            </div>
        `;
        favoritesList.appendChild(coinCard);
    });
}

// Search coins
function searchCoins() {
    let query = document.getElementById("search-input").value.toLowerCase();
    if (cachedSearchResults[query]) {
        displayFilteredCoins(cachedSearchResults[query]);
    } else {
        let filtered = allCoins.filter(coin => {
            let name = coin.name ? coin.name.toLowerCase() : "";
            let symbol = coin.symbol ? coin.symbol.toLowerCase() : "";
            return name.includes(query) || symbol.includes(query);
        });
        cachedSearchResults[query] = filtered;
        displayFilteredCoins(filtered);
    }
}

// Display filtered coins
function displayFilteredCoins(filteredCoins) {
    let coinsList = document.getElementById("coins-list");
    coinsList.innerHTML = "";

    filteredCoins.forEach(coin => {
        let name = coin.name || "Unknown Name";
        let symbol = coin.symbol || "Unknown Symbol";
        let price = coin.last_price_usd ? `$${parseFloat(coin.last_price_usd).toFixed(4)}` : "Price N/A";

        let coinCard = document.createElement("div");
        coinCard.classList.add("coin-card");
        coinCard.onclick = () => selectMainCoin(coin);
        coinCard.innerHTML = `
            <img class="coin-image" src="https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${coin.image_id}/coin64" alt="${coin.name} Image">
            <h3>${name} (${symbol})</h3>
            <p>Price: ${price}</p>
            <button onclick="addFavoriteCoin(event, '${coin.symbol}')">⭐ Add to Favorites</button>
            <button onclick="viewAlerts(event, '${coin.symbol}')">🔔 View Alerts</button>
            <button onclick="editAlerts(event, '${coin.symbol}')">✏️ Edit Alerts</button>
        `;
        coinsList.appendChild(coinCard);
    });

    document.getElementById("page-info").innerText = `Showing ${filteredCoins.length} results`;
}

// Function to view alerts for a specific coin
function viewAlerts(event, symbol) {
    event.stopPropagation(); // Prevent triggering selectMainCoin
    const coinAlerts = alerts.filter(alert => alert.symbol === symbol);
    if (coinAlerts.length === 0) {
        alert("No alerts set for this coin.");
        return;
    }
    let alertMessage = `Alerts for ${symbol}:\n`;
    coinAlerts.forEach((alert, index) => {
        alertMessage += `${index + 1}. ${alert.condition} $${alert.price}\n`;
    });
    alert(alertMessage);
}

// Function to edit alerts for a specific coin
function editAlerts(event, symbol) {
    event.stopPropagation(); // Prevent triggering selectMainCoin
    const coinAlerts = alerts.filter(alert => alert.symbol === symbol);
    if (coinAlerts.length === 0) {
        alert("No alerts to edit for this coin.");
        return;
    }

    // For simplicity, allow users to delete existing alerts or add new ones
    const action = prompt("Type 'delete' to remove all alerts or 'add' to add a new alert for this coin:");

    if (action === null) return; // User cancelled

    if (action.toLowerCase() === 'delete') {
        alerts = alerts.filter(alert => alert.symbol !== symbol);
        saveAlertsToLocalStorage();
        displayAlerts();
        alert(`All alerts for ${symbol} have been deleted.`);
    } else if (action.toLowerCase() === 'add') {
        const newPrice = prompt("Enter new alert price:");
        if (newPrice !== null && newPrice !== "") {
            const condition = prompt("Enter alert condition (above, below, equals, above_equal, below_equal):");
            if (['above', 'below', 'equals', 'above_equal', 'below_equal'].includes(condition)) {
                alerts.push({
                    symbol: symbol,
                    price: parseFloat(newPrice),
                    condition: condition,
                    soundFile: alertSoundFile
                });
                saveAlertsToLocalStorage();
                updateAlertCount();
                alert("New alert added successfully.");
                displayAlerts();
            } else {
                alert("Invalid condition entered.");
            }
        }
    } else {
        alert("Invalid action.");
    }
}

// Alert functions
function setMainCoinAlert() {
    if (!selectedCoin) {
        alert("No coin selected.");
        return;
    }
    const price = parseFloat(document.getElementById("alert-price").value);
    const condition = document.getElementById("alert-condition").value;
    const soundFile = alertSoundFile;

    if (isNaN(price)) {
        alert("Please enter a valid price.");
        return;
    }

    const newAlert = {
        symbol: selectedCoin.symbol,
        price: price,
        condition: condition,
        soundFile: soundFile
    };

    addAlert(newAlert);
    alert("✅ Alert set successfully.");
    displayAlerts();
}

function addAlert(alert) {
    alerts.push(alert);
    saveAlertsToLocalStorage();
    updateAlertCount();
}

function displayAlerts() {
    const alertsList = document.getElementById("alerts-list");
    alertsList.innerHTML = "";

    if (alerts.length === 0) {
        alertsList.innerHTML = "<p>No active alerts.</p>";
        updateAlertCount();
        return;
    }

    alerts.forEach((alert, index) => {
        const alertItem = document.createElement("div");
        alertItem.classList.add("alert-item");
        alertItem.innerHTML = `
            <p>${alert.symbol}: ${alert.condition} $${alert.price}</p>
            <button onclick="deleteAlert(${index})">🗑️ Delete</button>
        `;
        alertsList.appendChild(alertItem);
    });
    updateAlertCount();
}

function deleteAlert(index) {
    alerts.splice(index, 1);
    saveAlertsToLocalStorage();
    displayAlerts();
}

// Set as default coin
function setAsDefaultCoin(event, symbol) {
    event.stopPropagation();
    const coin = allCoins.find(c => c.symbol === symbol);
    if (!coin) {
        alert("Coin not found.");
        return;
    }
    // Remove existing default if any
    favoriteCoins = favoriteCoins.filter(c => c.symbol !== 'BLS5');
    // Add the new default coin at the beginning
    favoriteCoins.unshift(coin);
    saveFavoritesToLocalStorage();
    displayFavoriteCoins();
    selectMainCoin(coin);
    alert(`${coin.name} has been set as the default coin.`);
}

// Sound functions
function previewAlertSound() {
    const selectedValue = document.getElementById("alert-sound").value;
    if (selectedValue.startsWith("customSound_")) {
        alertSound.src = localStorage.getItem(selectedValue);
    } else {
        alertSound.src = `https://www.soundjay.com/button/sounds/${selectedValue}`;
    }
    alertSound.play();
}

function uploadCustomSound() {
    const fileInput = document.getElementById("custom-sound-upload");
    const file = fileInput.files[0];
    if (!file) {
        alert("Please select a sound file to upload.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Sound = e.target.result;
        const soundName = file.name;
        localStorage.setItem(`customSound_${soundName}`, base64Sound);
        alert("📤 Custom sound uploaded successfully.");
        populateSoundOptions();
    };
    reader.readAsDataURL(file);
}

function populateSoundOptions() {
    const soundSelect = document.getElementById("alert-sound");
    // Clear existing options except default
    soundSelect.innerHTML = `
        <option value="beep-07.mp3">🔊 Beep</option>
        <option value="beep-10.mp3">🔊 Beep 10</option>
        <option value="alert-tone.mp3">🔊 Alert Tone</option>
    `;

    // Add custom sounds from local storage
    for (let key in localStorage) {
        if (key.startsWith("customSound_")) {
            const soundName = key.replace("customSound_", "");
            soundSelect.innerHTML += `<option value="${key}">${soundName}</option>`;
        }
    }
}

function stopAlertSound() {
    alertSound.pause();
    alertSound.currentTime = 0;
    document.getElementById("stopSound").style.display = "none";
}

// Alert checking
function checkAlerts() {
    alerts.forEach(alert => {
        const coin = allCoins.find(c => c.symbol === alert.symbol);
        if (!coin || !coin.last_price_usd) return;

        const price = parseFloat(coin.last_price_usd);
        let conditionMet = false;

        switch (alert.condition) {
            case "above":
                conditionMet = price > alert.price;
                break;
            case "below":
                conditionMet = price < alert.price;
                break;
            case "equals":
                conditionMet = price === alert.price;
                break;
            case "above_equal":
                conditionMet = price >= alert.price;
                break;
            case "below_equal":
                conditionMet = price <= alert.price;
                break;
            default:
                break;
        }

        if (conditionMet) {
            if (alert.soundFile.startsWith("customSound_")) {
                alertSound.src = localStorage.getItem(alert.soundFile);
            } else {
                alertSound.src = `https://www.soundjay.com/button/sounds/${alert.soundFile}`;
            }
            alertSound.play().catch(error => {
                console.error("Error playing sound:", error);
            });
            document.getElementById("stopSound").style.display = "block";
            // Optionally, remove the alert after triggering
            // alerts = alerts.filter(a => a !== alert);
            // saveAlertsToLocalStorage();
        }
    });
}

// Periodically check alerts
setInterval(checkAlerts, 60000); // Check every minute


// Function to toggle the Favorite Coins section
function toggleFavoriteCoins() {
    const favoritesList = document.getElementById("favorite-coins-list");
    const toggleButton = document.getElementById("toggle-favorites");
    favoritesList.classList.toggle("collapsed");
    toggleButton.classList.toggle("rotated");
    // Change the arrow direction based on state
    if (favoritesList.classList.contains("collapsed")) {
        toggleButton.innerText = "▼"; // Collapsed state
    } else {
        toggleButton.innerText = "▲"; // Expanded state
    }
}

// Attach event listener to the toggle button
document.getElementById("toggle-favorites").addEventListener("click", toggleFavoriteCoins);

// Function to remove a favorite coin
function removeFavoriteCoin(event, symbol) {
    event.stopPropagation(); // Prevent triggering selectMainCoin
    favoriteCoins = favoriteCoins.filter(c => c.symbol !== symbol);
    saveFavoritesToLocalStorage();
    displayFavoriteCoins();
    alert(`❌ ${symbol} has been removed from your favorites.`);
}

// Local storage functions
function saveFavoritesToLocalStorage() {
    localStorage.setItem('favoriteCoins', JSON.stringify(favoriteCoins));
}

function loadFavoritesFromLocalStorage() {
    const storedFavorites = localStorage.getItem('favoriteCoins');
    if (storedFavorites) {
        favoriteCoins = JSON.parse(storedFavorites);
    }
}

function saveAlertsToLocalStorage() {
    localStorage.setItem('alerts', JSON.stringify(alerts));
}

function loadAlertsFromLocalStorage() {
    const storedAlerts = localStorage.getItem('alerts');
    if (storedAlerts) {
        alerts = JSON.parse(storedAlerts);
    }
}

// Update alert count
function updateAlertCount() {
    document.getElementById("alert-count").innerText = alerts.length;
}

// Initialize
function initialize() {
    populateSoundOptions();
    fetchCoins();
}

initialize();
