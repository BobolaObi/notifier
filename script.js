// API URL
const API_URL = "https://notifier-wgcq.onrender.com/api/all_coins";
// const API_URL = "http://localhost:3000/api/all_coins";

// Audio Elements
const alertSound = document.getElementById("alertSound");
const stopSoundButton = document.getElementById("stopSound");

// Data Arrays and Variables
let allCoins = [];
let favoriteCoins = [];
let currentPage = 1;
const coinsPerPage = 10;
let selectedCoin = null;
let alerts = [];
let cachedSearchResults = {};

// Array to Track Active Audio Instances
let activeAudios = [];

// Modal Elements
const customAlertModal = document.getElementById("customAlertModal");
const alertMessage = document.getElementById("alertMessage");
const alertCloseButton = document.getElementById("alertCloseButton");

const customPromptModal = document.getElementById("customPromptModal");
const promptMessage = document.getElementById("promptMessage");
const promptInput = document.getElementById("promptInput");
const promptOkButton = document.getElementById("promptOkButton");
const promptCancelButton = document.getElementById("promptCancelButton");
const promptCloseButton = document.getElementById("promptCloseButton");

const viewAlertsModal = document.getElementById("viewAlertsModal");
const viewAlertsCloseButton = document.getElementById("viewAlertsCloseButton");
const viewAlertsList = document.getElementById("viewAlertsList");

const editAlertModal = document.getElementById("editAlertModal");
const editAlertCloseButton = document.getElementById("editAlertCloseButton");
const editAlertForm = document.getElementById("editAlertForm");

  // Select elements by their ID
  const defaultCoinsButton = document.getElementById('default-coins-button');
  const searchCoinsButton = document.getElementById('search-coins-button');
  const alertsPageButton = document.getElementById('alerts-page-button');

  // Add event listeners to the buttons
  if (defaultCoinsButton) {
      defaultCoinsButton.addEventListener('click', showDefaultCoinPage);
  }

  if (searchCoinsButton) {
      searchCoinsButton.addEventListener('click', showSearchPage);
  }

  if (alertsPageButton) {
      alertsPageButton.addEventListener('click', showAlertsPage);
  }


// -----------------------
// Modal Handling Functions
// -----------------------

// Function to Show Alert Modal
function showAlert(message) {
    alertMessage.innerText = message;
    customAlertModal.style.display = "block";
}

// Function to Close Alert Modal
alertCloseButton.onclick = function() {
    customAlertModal.style.display = "none";
}

function clearSearchCache() {
    localStorage.removeItem('lastSearchQuery');
    localStorage.removeItem('cachedSearchResults');
}


// Function to Show Prompt Modal
function showPrompt(message) {
    return new Promise((resolve) => {
        promptMessage.innerText = message;
        promptInput.value = ""; // Clear previous input
        customPromptModal.style.display = "block";

        // Handler for OK Button
        const handleOk = () => {
            const input = promptInput.value;
            cleanup();
            resolve(input);
        }

        // Handler for Cancel Button
        const handleCancel = () => {
            cleanup();
            resolve(null); // Return null if canceled
        }

        // Cleanup Function to Remove Event Listeners
        function cleanup() {
            promptOkButton.removeEventListener("click", handleOk);
            promptCancelButton.removeEventListener("click", handleCancel);
            promptCloseButton.removeEventListener("click", handleCancel);
            window.removeEventListener("click", outsideClick);
            customPromptModal.style.display = "none";
        }

        // Attach Event Listeners
        promptOkButton.addEventListener("click", handleOk);
        promptCancelButton.addEventListener("click", handleCancel);
        promptCloseButton.onclick = handleCancel;

        // Handler for Clicking Outside the Modal
        function outsideClick(event) {
            if (event.target == customPromptModal) {
                handleCancel();
            }
        }

        window.addEventListener("click", outsideClick);
    });
}

// Function to Show View Alerts Modal
function showViewAlertsModal() {
    viewAlertsList.innerHTML = ""; // Clear existing alerts
    const coinAlerts = alerts.filter(alert => alert.symbol === selectedCoin.symbol);

    if (coinAlerts.length === 0) {
        let addButton = document.createElement("button");
        addButton.innerHTML = "➕ Add Alert";
        addButton.addEventListener("click", showEditAlertModal);
        viewAlertsList.innerHTML = "<p>No active alerts for this coin.</p>";
        viewAlertsList.appendChild(addButton);
    } else {
        coinAlerts.forEach((alert, index) => {
            let alertItem = document.createElement("div");
            alertItem.classList.add("alert-item");
            alertItem.innerHTML = `
                <p>${alert.symbol}: ${alert.condition} $${alert.price}</p>
            `;
            let deleteButton = document.createElement("button");
            deleteButton.innerHTML = "🗑️ Delete";
            deleteButton.addEventListener("click", () => deleteAlert(index));
            alertItem.appendChild(deleteButton);
            viewAlertsList.appendChild(alertItem);
        });
    }
    viewAlertsModal.style.display = "block";
}


// Function to Close View Alerts Modal
viewAlertsCloseButton.onclick = function() {
    viewAlertsModal.style.display = "none";
}

// Function to Show Edit Alert Modal
function showEditAlertModal() {
    editAlertForm.reset(); // Clear previous inputs
    editAlertModal.style.display = "block";
}

// Function to Close Edit Alert Modal
editAlertCloseButton.onclick = function() {
    editAlertModal.style.display = "none";
}

// Handle Edit Alert Form Submission
editAlertForm.addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent default form submission
    let price = parseFloat(document.getElementById("editAlertPrice").value);
    let condition = document.getElementById("editAlertCondition").value;
    let soundFile = document.getElementById("editAlertSound").value;

    if (isNaN(price) || price <= 0) {
        showAlert("Please enter a valid positive number for the price.");
        return;
    }

    // Ensure a coin is selected to set the alert
    if (!selectedCoin) {
        showAlert("No coin selected to set an alert.");
        return;
    }

    let newAlert = {
        symbol: selectedCoin.symbol,
        price: price,
        condition: condition,
        soundFile: soundFile
    };

    alerts.push(newAlert);
    saveAlertsToLocalStorage();
    updateAlertCount();
    showAlert("✅ New alert added successfully.");
    displayAlertsPage();
    editAlertModal.style.display = "none";
});

// -----------------------
// Audio Management Functions
// -----------------------

// Function to Play Alert Sound Without Blocking User Flow
function playAlertSound(soundFile) {
    const audio = new Audio();
    if (soundFile.startsWith("customSound_")) {
        audio.src = localStorage.getItem(soundFile);
    } else {
        audio.src = `https://www.soundjay.com/button/sounds/${soundFile}`;
    }
    audio.loop = false; // Disable looping for preview
    audio.play().catch(error => {
        console.error("Error playing sound:", error);
    });
    activeAudios.push(audio);
    // Show stop button if not already visible
    stopSoundButton.style.display = "block";
}

// Reuse the existing stopSoundButton initialization
if (stopSoundButton) {
    stopSoundButton.addEventListener('click', stopAllAlertSounds);
}

// Function to load the previous search state from local storage
function loadCachedSearch() {
    const lastQuery = localStorage.getItem('lastSearchQuery');
    if (lastQuery) {
        searchInput.value = lastQuery;  // Set the input value to the cached query
        const cachedResults = JSON.parse(localStorage.getItem('cachedSearchResults') || '{}');
        if (cachedResults[lastQuery]) {
            displayFilteredCoins(cachedResults[lastQuery]);
        }
    }
}


// Function to Stop All Alert Sounds
function stopAllAlertSounds() {
    activeAudios.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
    activeAudios = []; // Clear the array
    stopSoundButton.style.display = "none";
}

// // Event Listener for Stop Sound Button
// stopSoundButton.addEventListener("click", stopAllAlertSounds);

// -----------------------
// Coin Management Functions
// -----------------------

// Fetch coins from API
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
    } catch (e) {
        console.error("Error fetching coin data:", e);
    }
}

// Select default coin
function selectDefaultCoin() {
    let defaultSymbol = "BLS5";
    let defaultCoin = allCoins.find(coin => coin.symbol === defaultSymbol);
    if (defaultCoin) {
        addFavoriteCoin(null, defaultCoin.symbol, true);
        selectMainCoin(defaultCoin);
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

// Pagination Functions
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

// Display coins in the current page
function displayCoins() {
    let coinsList = document.getElementById("coins-list");
    coinsList.innerHTML = "";
    let startIndex = (currentPage - 1) * coinsPerPage;
    let currentCoins = allCoins.slice(startIndex, startIndex + coinsPerPage);

    currentCoins.forEach(coin => {
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
    let num = parseFloat(price);
    return isNaN(num) ? "Price N/A" :
        num >= 1 ? `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
        `$${num.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

// -----------------------
// Favorite Coins Functions
// -----------------------

// Add favorite coin
function addFavoriteCoin(event, symbol, isDefault = false) {
    if (event) event.stopPropagation();
    let coin = allCoins.find(c => c.symbol === symbol);
    if (coin && !favoriteCoins.some(fav => fav.symbol === coin.symbol)) {
        if (isDefault) {
            favoriteCoins.unshift(coin);
        } else {
            favoriteCoins.push(coin);
        }
        saveFavoritesToLocalStorage();
        displayFavoriteCoins();
    }
}

// Display favorite coins
function displayFavoriteCoins() {
    let favoriteCoinsList = document.getElementById("favorite-coins-list");
    favoriteCoinsList.innerHTML = "";

    if (favoriteCoins.length === 0) {
        favoriteCoinsList.innerHTML = "<p>No favorite coins added yet.</p>";
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
        favoriteCoinsList.appendChild(coinCard);
    });
}

// Remove favorite coin
function removeFavoriteCoin(event, symbol) {
    event.stopPropagation();
    favoriteCoins = favoriteCoins.filter(fav => fav.symbol !== symbol);
    saveFavoritesToLocalStorage();
    displayFavoriteCoins();
    showAlert(`❌ ${symbol} has been removed from your favorites.`);
}

// Set a coin as default
function setAsDefaultCoin(event, symbol) {
    event.stopPropagation();
    let coin = allCoins.find(c => c.symbol === symbol);
    if (!coin) {
        showAlert("Coin not found.");
        return;
    }
    // Remove existing default if any
    favoriteCoins = favoriteCoins.filter(fav => fav.symbol !== 'BLS5');
    // Add the new default coin at the beginning
    favoriteCoins.unshift(coin);
    saveFavoritesToLocalStorage();
    displayFavoriteCoins();
    selectMainCoin(coin);
    showAlert(`${coin.name} has been set as the default coin.`);
}

// -----------------------
// Search Functionality
// -----------------------

// Search coins

const searchInput = document.getElementById('search-input');
const prevPageButton = document.getElementById('prev-page-button');
const nextPageButton = document.getElementById('next-page-button');
// Pagination Functions
function nextPage() {
    if (currentPage * coinsPerPage < filteredCoins.length) {
        currentPage++;
        displayFilteredCoins();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayFilteredCoins();
    }
}
// Attach event listener to search input
if (searchInput) {
    searchInput.addEventListener('input', () => {
        searchCoins();
    });
}

// Attach event listeners to pagination buttons
if (prevPageButton) {
    prevPageButton.addEventListener('click', prevPage);
}

if (nextPageButton) {
    nextPageButton.addEventListener('click', nextPage);
}

// Variables for pagination state
let filteredCoins = [];



// function searchCoins() {
//     let query = document.getElementById("search-input").value.toLowerCase();
//     console.log(`Searching for: ${query}`);
//     if (cachedSearchResults[query]) {
//         displayFilteredCoins(cachedSearchResults[query]);
//     } else {
//         let filteredCoins = allCoins.filter(coin => {
//             let name = coin.name ? coin.name.toLowerCase() : "";
//             let symbol = coin.symbol ? coin.symbol.toLowerCase() : "";
//             return name.includes(query) || symbol.includes(query);
//         });
//         cachedSearchResults[query] = filteredCoins;
//         displayFilteredCoins(filteredCoins);
//     }
// }


function searchCoins() {
    let query = searchInput.value.toLowerCase();
    console.log(`Searching for: ${query}`);
    if (cachedSearchResults[query]) {
        // Use cached results from in-memory cache
        localStorage.setItem('lastSearchQuery', query);
        localStorage.setItem('cachedSearchResults', JSON.stringify(cachedSearchResults));
        displayFilteredCoins(cachedSearchResults[query]);
    } else {
        let filteredCoins = allCoins.filter(coin => {
            let name = coin.name ? coin.name.toLowerCase() : "";
            let symbol = coin.symbol ? coin.symbol.toLowerCase() : "";
            return name.includes(query) || symbol.includes(query);
        });
        // Update both local cache and in-memory cache
        cachedSearchResults[query] = filteredCoins;
        localStorage.setItem('lastSearchQuery', query);
        localStorage.setItem('cachedSearchResults', JSON.stringify(cachedSearchResults));
        displayFilteredCoins(filteredCoins);
    }
}

// Display filtered coins
function displayFilteredCoins(filteredCoins) {
    let coinsList = document.getElementById("coins-list");
    coinsList.innerHTML = "";

    if (filteredCoins.length === 0) {
        coinsList.innerHTML = "<p>No coins match your search.</p>";
        document.getElementById("page-info").innerText = "";
        return;
    }

    filteredCoins.forEach(coin => {
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

    document.getElementById("page-info").innerText = `Showing ${filteredCoins.length} results`;
}

// -----------------------
// Alert Management Functions
// -----------------------

// Set an alert for the main coin
function setMainCoinAlert() {
    if (!selectedCoin) {
        showAlert("No coin selected.");
        return;
    }
    let price = parseFloat(document.getElementById("alert-price").value);
    let condition = document.getElementById("alert-condition").value;
    let soundFile = document.getElementById("alert-sound").value;

    if (isNaN(price) || price <= 0) {
        showAlert("Please enter a valid price.");
        return;
    }
    let newAlert = {
        symbol: selectedCoin.symbol,
        price: price,
        condition: condition,
        soundFile: soundFile
    };
    alerts.push(newAlert);
    saveAlertsToLocalStorage();
    updateAlertCount();
    showAlert("✅ Alert set successfully.");
    displayAlertsPage();
}

// View Alerts for a specific coin
function viewAlerts(event, symbol) {
    event.stopPropagation();
    let coin = allCoins.find(c => c.symbol === symbol);
    if (!coin) {
        showAlert("Coin not found.");
        return;
    }
    selectedCoin = coin;
    showViewAlertsModal();
}

// Edit Alerts for a specific coin
function editAlerts(event, symbol) {
    event.stopPropagation();
    let coin = allCoins.find(c => c.symbol === symbol);
    if (!coin) {
        showAlert("Coin not found.");
        return;
    }
    selectedCoin = coin;
    showEditAlertModal();
}

// Delete an alert
function deleteAlert(index) {
    alerts.splice(index, 1);
    saveAlertsToLocalStorage();
    updateAlertCount();
    showViewAlertsModal(); // Refresh the View Alerts Modal
}

// Display Alerts in the Alerts Page
function displayAlertsPage() {
    const alertsList = document.getElementById('alerts-list');
    alertsList.innerHTML = ''; // Clear existing alerts

    if (alerts.length === 0) {
        alertsList.innerHTML = '<p>No active alerts.</p>';
        return;
    }

    alerts.forEach((alert, index) => {
        const alertItem = document.createElement('div');
        alertItem.classList.add('alert-item');
        alertItem.innerHTML = `
            <p>${alert.symbol}: ${alert.condition} $${alert.price}</p>
        `;
        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = "🗑️ Delete";
        deleteButton.addEventListener("click", () => deleteAlert(index));
        alertItem.appendChild(deleteButton);
        alertsList.appendChild(alertItem);
    });
}

// -----------------------
// Local Storage Functions
// -----------------------

// Save favorites to local storage
function saveFavoritesToLocalStorage() {
    localStorage.setItem("favoriteCoins", JSON.stringify(favoriteCoins));
}

// Load favorites from local storage
function loadFavoritesFromLocalStorage() {
    let storedFavorites = localStorage.getItem("favoriteCoins");
    if (storedFavorites) {
        favoriteCoins = JSON.parse(storedFavorites);
    }

    // Load collapsed state for favorites section
    let isCollapsed = localStorage.getItem("favoritesCollapsed") === "true";
    if (isCollapsed) {
        document.getElementById("favorite-coins-list").classList.add("collapsed");
        document.getElementById("toggle-favorites").classList.add("rotated");
        document.getElementById("toggle-favorites").innerText = "▼";
    }
}

// Save alerts to local storage
function saveAlertsToLocalStorage() {
    localStorage.setItem("alerts", JSON.stringify(alerts));
}

// Load alerts from local storage
function loadAlertsFromLocalStorage() {
    let storedAlerts = localStorage.getItem("alerts");
    if (storedAlerts) {
        alerts = JSON.parse(storedAlerts);
    }
}

// -----------------------
// Alert Checking Function
// -----------------------

// Function to Check Alerts Periodically
function checkAlerts() {
    alerts.forEach(alert => {
        let coin = allCoins.find(c => c.symbol === alert.symbol);
        if (!coin || !coin.last_price_usd) return;
        let price = parseFloat(coin.last_price_usd);
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
            playAlertSound(alert.soundFile);
        }
    });
}

// -----------------------
// Utility Functions
// -----------------------

  // Select elements by their IDs
  const alertSoundSelect = document.getElementById('alert-sound');
  const setAlertButton = document.getElementById('set-alert-button');
  const uploadSoundButton = document.getElementById('upload-sound-button');

   // Event listener for sound preview
   if (alertSoundSelect) {
    alertSoundSelect.addEventListener('change', previewAlertSound);
}

// Event listener for setting an alert
if (setAlertButton) {
    setAlertButton.addEventListener('click', setMainCoinAlert);
}

// Event listener for uploading a custom sound
if (uploadSoundButton) {
    uploadSoundButton.addEventListener('click', uploadCustomSound);
}
// Populate Sound Options (for Edit Alert Modal and Main Alert Section)
function populateSoundOptions() {
    let soundOptions = `
        <option value="beep-07.mp3">🔊 Beep</option>
        <option value="beep-10.mp3">🔊 Beep 10</option>
        <option value="alert-tone.mp3">🔊 Alert Tone</option>
    `;
    // Add custom sounds from localStorage
    for (let key in localStorage) {
        if (key.startsWith("customSound_")) {
            let soundName = key.replace("customSound_", "");
            soundOptions += `<option value="${key}">${soundName}</option>`;
        }
    }
    // Update both select elements
    let editAlertSoundSelect = document.getElementById("editAlertSound");
    if (editAlertSoundSelect) {
        editAlertSoundSelect.innerHTML = soundOptions;
    }
    let alertSoundSelect = document.getElementById("alert-sound");
    if (alertSoundSelect) {
        alertSoundSelect.innerHTML = soundOptions;
    }
}

// Function to Upload Custom Sound
function uploadCustomSound() {
    const fileInput = document.getElementById('custom-sound-upload');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const soundData = e.target.result;
            const soundKey = 'customSound_' + file.name;
            localStorage.setItem(soundKey, soundData);
            populateSoundOptions(); // Update the sound options dropdown
            showAlert('Custom sound uploaded successfully!');
        };
        reader.readAsDataURL(file);
    } else {
        showAlert('Please select a sound file to upload.');
    }
}

// Function to Preview Alert Sound
function previewAlertSound() {
    const soundSelect = document.getElementById('alert-sound');
    const selectedSound = soundSelect.value;
    playAlertSound(selectedSound);
}


// Function to Toggle the Favorite Coins Section and Persist State
function toggleFavoriteCoins() {
    let favoriteCoinsList = document.getElementById("favorite-coins-list");
    let toggleButton = document.getElementById("toggle-favorites");
    favoriteCoinsList.classList.toggle("collapsed");
    toggleButton.classList.toggle("rotated");
    if (favoriteCoinsList.classList.contains("collapsed")) {
        toggleButton.innerText = "▼";
        localStorage.setItem("favoritesCollapsed", "true");
    } else {
        toggleButton.innerText = "▲";
        localStorage.setItem("favoritesCollapsed", "false");
    }
}

// -----------------------
// Initialization Function
// -----------------------

// Initialize the Application
// function initialize() {
//     populateSoundOptions();
//     fetchCoins();
// }
// Initialize the Application
function initialize() {
    populateSoundOptions();
    fetchCoins().then(() => {
        loadCachedSearch();  // Load cached search results after fetching coins
    });
}


// -----------------------
// Event Listeners and Timers
// -----------------------

// Periodically Check Alerts Every Minute (60000 ms)
setInterval(checkAlerts, 60000);

// Event Listener for Toggle Favorites Button
document.getElementById("toggle-favorites").addEventListener("click", toggleFavoriteCoins);

// Initialize the Application on Page Load
initialize();

// Close Modals When Clicking Outside of Them
window.onclick = function(event) {
    if (event.target == customAlertModal) {
        customAlertModal.style.display = "none";
    }
    if (event.target == viewAlertsModal) {
        viewAlertsModal.style.display = "none";
    }
    if (event.target == editAlertModal) {
        editAlertModal.style.display = "none";
    }
    if (event.target == customPromptModal) {
        customPromptModal.style.display = "none";
    }
}

// Show Default Coin Page
function showDefaultCoinPage() {
    document.getElementById("default-coin").style.display = "block";
    document.getElementById("search-coin").style.display = "none";
    document.getElementById("alerts-page").style.display = "none";
    displayFavoriteCoins();
}

// Show Search Page
function showSearchPage() {
    document.getElementById("default-coin").style.display = "none";
    document.getElementById("search-coin").style.display = "block";
    document.getElementById("alerts-page").style.display = "none";
    displayCoins();
}

// Show Alerts Page
function showAlertsPage() {
    document.getElementById("default-coin").style.display = "none";
    document.getElementById("search-coin").style.display = "none";
    document.getElementById("alerts-page").style.display = "block";
    displayAlertsPage(); // Display the alerts
}

// Function to Update Alert Count in Navigation
function updateAlertCount() {
    const alertCountElem = document.getElementById("alert-count");
    if (alertCountElem) {
        alertCountElem.innerText = alerts.length;
    } else {
        console.warn("Element with ID 'alert-count' not found.");
    }
}

chrome.runtime.onInstalled.addListener(() => {
    console.log('Crypto API Extension Installed');
  });
  
  // Content script to handle API calls and data presentation (content.js)
  async function fetchData(url) {
    console.log(`Fetching data from URL: ${url}`);
    try {
      const response = await fetch(url);
      console.log(`Response status: ${response.status}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('Data successfully fetched:', data);
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }