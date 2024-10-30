const API_URL = "https://notifier-wgcq.onrender.com/api/all_coins";
const alertSound = document.getElementById("alertSound");
const stopSoundButton = document.getElementById("stopSound");

let allCoins = [];
let favoriteCoins = [];
let currentPage = 1;
const coinsPerPage = 10;
let selectedCoin = null;
let alerts = [];
let cachedSearchResults = {};
let activeAudios = [];

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

const defaultCoinsButton = document.getElementById("default-coins-button");
const searchCoinsButton = document.getElementById("search-coins-button");
const alertsPageButton = document.getElementById("alerts-page-button");

// Modal Functions
function showAlert(message) {
    alertMessage.innerText = message;
    customAlertModal.style.display = "block";
}

function showPrompt(message) {
    return new Promise((resolve) => {
        promptMessage.innerText = message;
        promptInput.value = "";
        customPromptModal.style.display = "block";

        const handleOk = () => {
            const input = promptInput.value;
            cleanup();
            resolve(input);
        };

        const handleCancel = () => {
            cleanup();
            resolve(null);
        };

        function cleanup() {
            promptOkButton.removeEventListener("click", handleOk);
            promptCancelButton.removeEventListener("click", handleCancel);
            promptCloseButton.removeEventListener("click", handleCancel);
            window.removeEventListener("click", handleOutsideClick);
            customPromptModal.style.display = "none";
        }

        function handleOutsideClick(event) {
            if (event.target === customPromptModal) {
                handleCancel();
            }
        }

        promptOkButton.addEventListener("click", handleOk);
        promptCancelButton.addEventListener("click", handleCancel);
        promptCloseButton.addEventListener("click", handleCancel);
        window.addEventListener("click", handleOutsideClick);
    });
}

// Alert Modal Functions
function showViewAlertsModal() {
    viewAlertsList.innerHTML = "";
    const coinAlerts = alerts.filter(alert => alert.symbol === selectedCoin.symbol);

    if (coinAlerts.length === 0) {
        const addButton = document.createElement("button");
        addButton.innerHTML = "➕ Add Alert";
        addButton.addEventListener("click", showEditAlertModal);
        viewAlertsList.innerHTML = "<p>No active alerts for this coin.</p>";
        viewAlertsList.appendChild(addButton);
    } else {
        coinAlerts.forEach((alert, index) => {
            const alertItem = document.createElement("div");
            alertItem.classList.add("alert-item");
            alertItem.innerHTML = `
                <p>${alert.symbol}: ${alert.condition} $${alert.price}</p>
            `;

            const deleteButton = document.createElement("button");
            deleteButton.innerHTML = "🗑️ Delete";
            deleteButton.addEventListener("click", () => deleteAlert(index));

            alertItem.appendChild(deleteButton);
            viewAlertsList.appendChild(alertItem);
        });
    }
    viewAlertsModal.style.display = "block";
}

function showEditAlertModal() {
    editAlertForm.reset();
    editAlertModal.style.display = "block";
}

// Audio Functions
function playAlertSound(soundFile) {
    const audio = new Audio();
    if (soundFile.startsWith("customSound_")) {
        audio.src = localStorage.getItem(soundFile);
    } else {
        audio.src = `https://www.soundjay.com/button/sounds/${soundFile}`;
    }
    audio.loop = false;
    audio.play().catch(error => {
        console.error("Error playing sound:", error);
    });
    activeAudios.push(audio);
    stopSoundButton.style.display = "block";
}

function stopAllAlertSounds() {
    activeAudios.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
    activeAudios = [];
    stopSoundButton.style.display = "none";
}

// Fetch and Display Functions
async function fetchCoins() {
    try {
        console.log("Fetching coins...");
        const response = await fetch(API_URL);
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

function selectDefaultCoin() {
    const defaultSymbol = "BLS5";
    const defaultCoin = allCoins.find(coin => coin.symbol === defaultSymbol);
    if (defaultCoin) {
        addFavoriteCoin(null, defaultCoin.symbol, true);
        selectMainCoin(defaultCoin);
    } else {
        console.log(`Default coin with symbol ${defaultSymbol} not found.`);
    }
}

function selectMainCoin(coin) {
    selectedCoin = coin;
    document.getElementById("selected-coin-name").innerText = `${coin.name || "Unknown"} (${coin.symbol || "Unknown"})`;
    document.getElementById("selected-coin-price").innerText = formatPrice(coin.last_price_usd);
    document.getElementById("selected-coin-rank").innerText = coin.market_cap_rank ? `#${coin.market_cap_rank}` : "N/A";
    document.getElementById("selected-coin-volume").innerText = coin.volume_24_usd ? `${formatPrice(coin.volume_24_usd)}` : "N/A";

    const coinImage = document.getElementById("selected-coin-image");
    if (coin.image_id) {
        coinImage.src = `https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${coin.image_id}/coin64`;
        coinImage.style.display = "block";
    } else {
        coinImage.style.display = "none";
    }

    showDefaultCoinPage();
}

function formatPrice(price) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) return "Price N/A";
    return parsedPrice >= 1
        ? `$${parsedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${parsedPrice.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

// Pagination Functions
function changePage(direction, context) {
    if (context === 'all') {
        if (direction === 'next' && currentPage * coinsPerPage < allCoins.length) {
            currentPage++;
            displayCoins();
        } else if (direction === 'prev' && currentPage > 1) {
            currentPage--;
            displayCoins();
        }
    } else if (context === 'filtered') {
        if (direction === 'next' && currentPage * coinsPerPage < filteredCoins.length) {
            currentPage++;
            displayFilteredCoins();
        } else if (direction === 'prev' && currentPage > 1) {
            currentPage--;
            displayFilteredCoins();
        }
    }
}

const searchInput = document.getElementById("search-input");
const prevPageButton = document.getElementById("prev-page-button");
const nextPageButton = document.getElementById("next-page-button");

let filteredCoins = [];
let currentView = 'all'; // Track current view: 'all' or 'filtered'

// Event Listeners for Pagination
prevPageButton && prevPageButton.addEventListener("click", () => changePage('prev', currentView));
nextPageButton && nextPageButton.addEventListener("click", () => changePage('next', currentView));

// Display Functions
function displayCoins() {
    const coinsList = document.getElementById("coins-list");
    coinsList.innerHTML = "";

    const start = (currentPage - 1) * coinsPerPage;
    const end = start + coinsPerPage;
    const coinsToDisplay = allCoins.slice(start, end);

    coinsToDisplay.forEach(coin => {
        const coinName = coin.name || "Unknown Name";
        const coinSymbol = coin.symbol || "Unknown Symbol";
        const coinPrice = formatPrice(coin.last_price_usd);

        const coinCard = document.createElement("div");
        coinCard.classList.add("coin-card");
        coinCard.onclick = () => selectMainCoin(coin);
        coinCard.innerHTML = `
            <div class="coin-info">
                <img class="coin-image" src="https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${coin.image_id}/coin64" alt="${coin.name} Image">
                <h3>${coinName} (${coinSymbol})</h3>
                <p>Price: ${coinPrice}</p>
            </div>
            <div class="coin-actions">
                <button class="btn-add-fav" onclick="addFavoriteCoin(event, '${coin.symbol}')">⭐ Add to Favorites</button>
                <button class="btn-view-alerts" onclick="viewAlerts(event, '${coin.symbol}')">🔔 View Alerts</button>
                <button class="btn-edit-alerts" onclick="editAlerts(event, '${coin.symbol}')">✏️ Edit Alerts</button>
            </div>
        `;
        coinsList.appendChild(coinCard);
    });

    document.getElementById("page-info").innerText = `Page ${currentPage} of ${Math.ceil(allCoins.length / coinsPerPage)}`;
}

function displayFilteredCoins() {
    const coinsList = document.getElementById("coins-list");
    coinsList.innerHTML = "";

    const start = (currentPage - 1) * coinsPerPage;
    const end = start + coinsPerPage;
    const coinsToDisplay = filteredCoins.slice(start, end);

    if (filteredCoins.length === 0) {
        coinsList.innerHTML = "<p>No coins match your search.</p>";
        document.getElementById("page-info").innerText = "";
        return;
    }

    coinsToDisplay.forEach(coin => {
        const coinName = coin.name || "Unknown Name";
        const coinSymbol = coin.symbol || "Unknown Symbol";
        const coinPrice = formatPrice(coin.last_price_usd);

        const coinCard = document.createElement("div");
        coinCard.classList.add("coin-card");
        coinCard.onclick = () => selectMainCoin(coin);
        coinCard.innerHTML = `
            <div class="coin-info">
                <img class="coin-image" src="https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${coin.image_id}/coin64" alt="${coin.name} Image">
                <h3>${coinName} (${coinSymbol})</h3>
                <p>Price: ${coinPrice}</p>
            </div>
            <div class="coin-actions">
                <button class="btn-add-fav" onclick="addFavoriteCoin(event, '${coin.symbol}')">⭐ Add to Favorites</button>
                <button class="btn-view-alerts" onclick="viewAlerts(event, '${coin.symbol}')">🔔 View Alerts</button>
                <button class="btn-edit-alerts" onclick="editAlerts(event, '${coin.symbol}')">✏️ Edit Alerts</button>
            </div>
        `;
        coinsList.appendChild(coinCard);
    });

    document.getElementById("page-info").innerText = `Showing ${filteredCoins.length} results`;
}

// Search Function
function searchCoins() {
    const query = searchInput.value.toLowerCase();
    console.log(`Searching for: ${query}`);

    if (cachedSearchResults[query]) {
        localStorage.setItem("lastSearchQuery", query);
        localStorage.setItem("cachedSearchResults", JSON.stringify(cachedSearchResults));
        filteredCoins = cachedSearchResults[query];
        currentView = 'filtered';
        currentPage = 1;
        displayFilteredCoins();
    } else {
        const results = allCoins.filter(coin => {
            const name = coin.name ? coin.name.toLowerCase() : "";
            const symbol = coin.symbol ? coin.symbol.toLowerCase() : "";
            return name.includes(query) || symbol.includes(query);
        });
        cachedSearchResults[query] = results;
        localStorage.setItem("lastSearchQuery", query);
        localStorage.setItem("cachedSearchResults", JSON.stringify(cachedSearchResults));
        filteredCoins = results;
        currentView = 'filtered';
        currentPage = 1;
        displayFilteredCoins();
    }
}

// Favorite Coins Functions
function addFavoriteCoin(event, symbol, isDefault = false) {
    if (event) event.stopPropagation();
    const coin = allCoins.find(c => c.symbol === symbol);
    if (coin && !favoriteCoins.some(fav => fav.symbol === coin.symbol)) {
        isDefault ? favoriteCoins.unshift(coin) : favoriteCoins.push(coin);
        saveFavoritesToLocalStorage();
        displayFavoriteCoins();
    }
}

function displayFavoriteCoins() {
    const favoritesList = document.getElementById("favorite-coins-list");
    favoritesList.innerHTML = "";

    if (favoriteCoins.length === 0) {
        favoritesList.innerHTML = "<p>No favorite coins added yet.</p>";
        return;
    }

    favoriteCoins.forEach(coin => {
        const coinName = coin.name || "Unknown Name";
        const coinSymbol = coin.symbol || "Unknown Symbol";
        const coinPrice = formatPrice(coin.last_price_usd);

        const coinCard = document.createElement("div");
        coinCard.classList.add("coin-card");
        coinCard.onclick = () => selectMainCoin(coin);
        coinCard.innerHTML = `
            <div class="coin-info">
                <img class="coin-image" src="https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${coin.image_id}/coin64" alt="${coin.name} Image">
                <h3>${coinName} (${coinSymbol})</h3>
                <p>Price: ${coinPrice}</p>
            </div>
            <div class="coin-actions">
                <button class="btn-set-default" onclick="setAsDefaultCoin(event, '${coin.symbol}')">🔄 Set as Default</button>
                <button class="btn-view-alerts" onclick="viewAlerts(event, '${coin.symbol}')">🔔 View Alerts</button>
                <button class="btn-edit-alerts" onclick="editAlerts(event, '${coin.symbol}')">✏️ Edit Alerts</button>
                <button class="btn-remove-fav" onclick="removeFavoriteCoin(event, '${coin.symbol}')">🗑️ Remove</button>
            </div>
        `;
        favoritesList.appendChild(coinCard);
    });
}

function removeFavoriteCoin(event, symbol) {
    event.stopPropagation();
    favoriteCoins = favoriteCoins.filter(coin => coin.symbol !== symbol);
    saveFavoritesToLocalStorage();
    displayFavoriteCoins();
    showAlert(`❌ ${symbol} has been removed from your favorites.`);
}

function setAsDefaultCoin(event, symbol) {
    event.stopPropagation();
    const coin = allCoins.find(c => c.symbol === symbol);
    if (!coin) {
        showAlert("Coin not found.");
        return;
    }
    favoriteCoins = favoriteCoins.filter(c => c.symbol !== "BLS5");
    favoriteCoins.unshift(coin);
    saveFavoritesToLocalStorage();
    displayFavoriteCoins();
    selectMainCoin(coin);
    showAlert(`${coin.name} has been set as the default coin.`);
}

// Alert Management Functions
function setMainCoinAlert() {
    if (!selectedCoin) {
        showAlert("No coin selected.");
        return;
    }

    const price = parseFloat(document.getElementById("alert-price").value);
    const condition = document.getElementById("alert-condition").value;
    const soundFile = document.getElementById("alert-sound").value;

    if (isNaN(price) || price <= 0) {
        showAlert("Please enter a valid price.");
        return;
    }

    const newAlert = {
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

function viewAlerts(event, symbol) {
    event.stopPropagation();
    const coin = allCoins.find(c => c.symbol === symbol);
    if (!coin) {
        showAlert("Coin not found.");
        return;
    }
    selectedCoin = coin;
    showViewAlertsModal();
}

function editAlerts(event, symbol) {
    event.stopPropagation();
    const coin = allCoins.find(c => c.symbol === symbol);
    if (!coin) {
        showAlert("Coin not found.");
        return;
    }
    selectedCoin = coin;
    showEditAlertModal();
}

function deleteAlert(index) {
    alerts.splice(index, 1);
    saveAlertsToLocalStorage();
    updateAlertCount();
    showViewAlertsModal();
}

function displayAlertsPage() {
    const alertsList = document.getElementById("alerts-list");
    alertsList.innerHTML = "";

    if (alerts.length === 0) {
        alertsList.innerHTML = "<p>No active alerts.</p>";
        return;
    }

    alerts.forEach((alert, index) => {
        const alertItem = document.createElement("div");
        alertItem.classList.add("alert-item");
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

// Local Storage Functions
function saveFavoritesToLocalStorage() {
    localStorage.setItem("favoriteCoins", JSON.stringify(favoriteCoins));
}

function loadFavoritesFromLocalStorage() {
    const storedFavorites = localStorage.getItem("favoriteCoins");
    if (storedFavorites) {
        favoriteCoins = JSON.parse(storedFavorites);
    }

    if (localStorage.getItem("favoritesCollapsed") === "true") {
        document.getElementById("favorite-coins-list").classList.add("collapsed");
        const toggleButton = document.getElementById("toggle-favorites");
        toggleButton.classList.add("rotated");
        toggleButton.innerText = "▼";
    }

    displayFavoriteCoins();
}

function saveAlertsToLocalStorage() {
    localStorage.setItem("alerts", JSON.stringify(alerts));
}



// Unified Storage Functions

/**
 * Save data to storage.
 * @param {string} key - The key under which the data is stored.
 * @param {any} value - The data to store.
 * @returns {Promise<void>}
 */
function saveToStorage(key, value) {
    return new Promise((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            // Chrome Extension environment
            chrome.storage.local.set({ [key]: value }, () => {
                if (chrome.runtime.lastError) {
                    console.error(`Error saving ${key}:`, chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    console.log(`Saved ${key} to chrome.storage.local.`);
                    resolve();
                }
            });
        } else {
            // Standard Web environment
            try {
                localStorage.setItem(key, JSON.stringify(value));
                console.log(`Saved ${key} to localStorage.`);
                resolve();
            } catch (error) {
                console.error(`Error saving ${key} to localStorage:`, error);
                reject(error);
            }
        }
    });
}

/**
 * Load data from storage.
 * @param {string} key - The key of the data to load.
 * @returns {Promise<any>} - The retrieved data.
 */
function loadFromStorage(key) {
    return new Promise((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            // Chrome Extension environment
            chrome.storage.local.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    console.error(`Error loading ${key}:`, chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    console.log(`Loaded ${key} from chrome.storage.local.`);
                    resolve(result[key]);
                }
            });
        } else {
            // Standard Web environment
            try {
                const data = localStorage.getItem(key);
                console.log(`Loaded ${key} from localStorage.`);
                resolve(data ? JSON.parse(data) : null);
            } catch (error) {
                console.error(`Error loading ${key} from localStorage:`, error);
                reject(error);
            }
        }
    });
}

/**
 * Save favorites to storage.
 * @returns {Promise<void>}
 */
function saveFavoritesToStorage() {
    return saveToStorage("favoriteCoins", favoriteCoins)
        .then(() => console.log("Favorites successfully saved."))
        .catch(error => {
            console.error("Error saving favorites:", error);
            showAlert("Error saving favorites.");
        });
}

/**
 * Load favorites from storage.
 * @returns {Promise<void>}
 */
function loadFavoritesFromStorage() {
    return loadFromStorage("favoriteCoins")
        .then(storedFavorites => {
            if (storedFavorites) {
                favoriteCoins = storedFavorites;
            }

            return loadFromStorage("favoritesCollapsed");
        })
        .then(favoritesCollapsed => {
            if (favoritesCollapsed === "true") {
                document.getElementById("favorite-coins-list").classList.add("collapsed");
                const toggleButton = document.getElementById("toggle-favorites");
                toggleButton.classList.add("rotated");
                toggleButton.innerText = "▼";
            }

            displayFavoriteCoins();
            console.log("Favorites successfully loaded.");
        })
        .catch(error => {
            console.error("Error loading favorites:", error);
            showAlert("Error loading favorites.");
        });
}

/**
 * Save alerts to storage.
 * @returns {Promise<void>}
 */
function saveAlertsToLocalStorage() {
    return saveToStorage("alerts", alerts)
        .then(() => console.log("Alerts successfully saved."))
        .catch(error => {
            console.error("Error saving alerts:", error);
            showAlert("Error saving alerts.");
        });
}

/**
 * Load alerts from storage.
 * @returns {Promise<void>}
 */
function loadAlertsFromLocalStorage() {
    return loadFromStorage("alerts")
        .then(storedAlerts => {
            if (storedAlerts) {
                alerts = storedAlerts;
            }
            console.log("Alerts successfully loaded.");
        })
        .catch(error => {
            console.error("Error loading alerts:", error);
            showAlert("Error loading alerts.");
        });
}


// Alert Checking Function
function checkAlerts() {
    alerts.forEach(alert => {
        const coin = allCoins.find(c => c.symbol === alert.symbol);
        if (!coin || !coin.last_price_usd) return;

        const currentPrice = parseFloat(coin.last_price_usd);
        let conditionMet = false;

        switch (alert.condition) {
            case "above":
                conditionMet = currentPrice > alert.price;
                break;
            case "below":
                conditionMet = currentPrice < alert.price;
                break;
            case "equals":
                conditionMet = currentPrice === alert.price;
                break;
            case "above_equal":
                conditionMet = currentPrice >= alert.price;
                break;
            case "below_equal":
                conditionMet = currentPrice <= alert.price;
                break;
            default:
                break;
        }

        if (conditionMet) {
            playAlertSound(alert.soundFile);
        }
    });
}

// Sound Management Functions
const alertSoundSelect = document.getElementById("alert-sound");
const setAlertButton = document.getElementById("set-alert-button");
const uploadSoundButton = document.getElementById("upload-sound-button");

function populateSoundOptions() {
    let options = `
        <option value="alert-tone.mp3">🔊 Alert Tone</option>
    `;

    for (let key in localStorage) {
        if (key.startsWith("customSound_")) {
            options += `<option value="${key}">${key.replace("customSound_", "")}</option>`;
        }
    }

    const editAlertSound = document.getElementById("editAlertSound");
    if (editAlertSound) {
        editAlertSound.innerHTML = options;
    }

    if (alertSoundSelect) {
        alertSoundSelect.innerHTML = options;
    }
}

function uploadCustomSound() {
    const fileInput = document.getElementById("custom-sound-upload");
    const file = fileInput.files[0];

    if (file) {
        // Validate file type (e.g., only allow mp3 and wav)
        const allowedTypes = ['audio/mpeg', 'audio/wav'];
        if (!allowedTypes.includes(file.type)) {
            showAlert("Invalid file type. Please upload an MP3 or WAV file.");
            return;
        }

        // Limit file size to 1MB
        if (file.size > 1 * 1024 * 1024) {
            showAlert("Please upload a sound file smaller than 1MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const dataUrl = event.target.result;
            const key = "customSound_" + file.name;
            try {
                chrome.storage.local.set({ [key]: dataUrl }, () => {
                    populateSoundOptions();
                    showAlert("Custom sound uploaded successfully!");
                });
            } catch (e) {
                console.error("Error saving to chrome.storage.local:", e);
                showAlert("Failed to upload sound. Please try a smaller file.");
            }
        };
        reader.readAsDataURL(file);
    } else {
        showAlert("Please select a sound file to upload.");
    }
}


function previewAlertSound() {
    const soundFile = alertSoundSelect.value;
    playAlertSound(soundFile);
}

// Favorites Toggle Function
function toggleFavoriteCoins() {
    const favoritesList = document.getElementById("favorite-coins-list");
    const toggleButton = document.getElementById("toggle-favorites");
    favoritesList.classList.toggle("collapsed");
    toggleButton.classList.toggle("rotated");

    if (favoritesList.classList.contains("collapsed")) {
        toggleButton.innerText = "▼";
        localStorage.setItem("favoritesCollapsed", "true");
    } else {
        toggleButton.innerText = "▲";
        localStorage.setItem("favoritesCollapsed", "false");
    }
}

// Initialization Function
function initialize() {
    populateSoundOptions();
    fetchCoins().then(() => {
        loadCachedSearch();
    });
}

// Cached Search Functions
function loadCachedSearch() {
    const lastQuery = localStorage.getItem("lastSearchQuery");
    if (lastQuery) {
        searchInput.value = lastQuery;
        const cachedResults = JSON.parse(localStorage.getItem("cachedSearchResults") || "{}");
        if (cachedResults[lastQuery]) {
            filteredCoins = cachedResults[lastQuery];
            currentView = 'filtered';
            currentPage = 1;
            displayFilteredCoins();
        }
    }
}

// Event Listeners
defaultCoinsButton && defaultCoinsButton.addEventListener("click", showDefaultCoinPage);
searchCoinsButton && searchCoinsButton.addEventListener("click", showSearchPage);
alertsPageButton && alertsPageButton.addEventListener("click", showAlertsPage);

alertCloseButton.onclick = () => { customAlertModal.style.display = "none"; };
viewAlertsCloseButton.onclick = () => { viewAlertsModal.style.display = "none"; };
editAlertCloseButton.onclick = () => { editAlertModal.style.display = "none"; };

editAlertForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const price = parseFloat(document.getElementById("editAlertPrice").value);
    const condition = document.getElementById("editAlertCondition").value;
    const soundFile = document.getElementById("editAlertSound").value;

    if (isNaN(price) || price <= 0) {
        showAlert("Please enter a valid positive number for the price.");
        return;
    }

    if (!selectedCoin) {
        showAlert("No coin selected to set an alert.");
        return;
    }

    const newAlert = {
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

stopSoundButton && stopSoundButton.addEventListener("click", stopAllAlertSounds);

searchInput && searchInput.addEventListener("input", searchCoins);

alertSoundSelect && alertSoundSelect.addEventListener("change", previewAlertSound);
setAlertButton && setAlertButton.addEventListener("click", setMainCoinAlert);
uploadSoundButton && uploadSoundButton.addEventListener("click", uploadCustomSound);

document.getElementById("toggle-favorites") && document.getElementById("toggle-favorites").addEventListener("click", toggleFavoriteCoins);

// Expose Functions to Global Scope for Inline Event Handlers
window.addFavoriteCoin = addFavoriteCoin;
window.viewAlerts = viewAlerts;
window.editAlerts = editAlerts;

// Conditional Chrome Extension Listener
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener(() => {
        console.log("Crypto API Extension Installed");
    });
}

// Periodically Check Alerts
setInterval(checkAlerts, 60000); // Every 60 seconds

// Page Display Functions
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
    displayAlertsPage();
}

function updateAlertCount() {
    const alertCountElement = document.getElementById("alert-count");
    if (alertCountElement) {
        alertCountElement.innerText = alerts.length;
    } else {
        console.warn("Element with ID 'alert-count' not found.");
    }
}

// Handle Clicks Outside Modals to Close Them
window.onclick = function(event) {
    if (event.target === customAlertModal) {
        customAlertModal.style.display = "none";
    }
    if (event.target === viewAlertsModal) {
        viewAlertsModal.style.display = "none";
    }
    if (event.target === editAlertModal) {
        editAlertModal.style.display = "none";
    }
    if (event.target === customPromptModal) {
        customPromptModal.style.display = "none";
    }
};

// Initialize the Application
initialize();
