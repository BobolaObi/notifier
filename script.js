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
    } catch (e) {
        console.error("Error fetching coin data:", e);
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
    let e = "BLS5";
    let t = allCoins.find(t => t.symbol === e);
    if (t) {
        addFavoriteCoin(null, t.symbol, true);
    } else {
        console.log(`Default coin with symbol ${e} not found.`);
    }
}

// Select main coin to display details
function selectMainCoin(e) {
    selectedCoin = e;
    let t = document.getElementById("selected-coin-name"),
        o = document.getElementById("selected-coin-price"),
        n = document.getElementById("selected-coin-rank"),
        l = document.getElementById("selected-coin-volume"),
        i = document.getElementById("selected-coin-image");
    t.innerText = `${e.name || "Unknown"} (${e.symbol || "Unknown"})`;
    o.innerText = formatPrice(e.last_price_usd);
    n.innerText = e.market_cap_rank ? `#${e.market_cap_rank}` : "N/A";
    l.innerText = e.volume_24_usd ? `${formatPrice(e.volume_24_usd)}` : "N/A";
    if (e.image_id) {
        i.src = `https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${e.image_id}/coin64`;
        i.style.display = "block";
    } else {
        i.style.display = "none";
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

// Display coins in the current page
function displayCoins() {
    let e = document.getElementById("coins-list");
    e.innerHTML = "";
    let t = (currentPage - 1) * coinsPerPage;
    allCoins.slice(t, t + coinsPerPage).forEach(t => {
        let o = t.name || "Unknown Name",
            n = t.symbol || "Unknown Symbol",
            l = formatPrice(t.last_price_usd),
            i = document.createElement("div");
        i.classList.add("coin-card");
        i.onclick = () => selectMainCoin(t);
        i.innerHTML = `
            <div style="margin-bottom: 15px;">
                <img class="coin-image" src="https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${t.image_id}/coin64" alt="${t.name} Image" style="width: 64px; height: 64px;">
                <h3>${o} (${n})</h3>
                <p>Price: ${l}</p>
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
                " onclick="addFavoriteCoin(event, '${t.symbol}')">⭐ Add to Favorites</button>
                <button style="
                    flex: 1;
                    background-color: tomato;
                    color: white;
                    border: none;
                    padding: 8px 0;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9em;
                " onclick="viewAlerts(event, '${t.symbol}')">🔔 View Alerts</button>
                <button style="
                    flex: 1;
                    background-color: tomato;
                    color: white;
                    border: none;
                    padding: 8px 0;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9em;
                " onclick="editAlerts(event, '${t.symbol}')">✏️ Edit Alerts</button>
            </div>
        `;
        e.appendChild(i);
    });
    document.getElementById("page-info").innerText = `Page ${currentPage} of ${Math.ceil(allCoins.length / coinsPerPage)}`;
}

// Helper function to format prices
function formatPrice(e) {
    let t = parseFloat(e);
    return isNaN(t) ? "Price N/A" : t >= 1 ? `$${t.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${t.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

// Add favorite coin
function addFavoriteCoin(e, t, o = false) {
    if (e) e.stopPropagation();
    let n = allCoins.find(e => e.symbol === t);
    if (n && !favoriteCoins.some(e => e.symbol === n.symbol)) {
        if (o) {
            favoriteCoins.unshift(n);
        } else {
            favoriteCoins.push(n);
        }
        saveFavoritesToLocalStorage();
        displayFavoriteCoins();
    }
}

// Display favorite coins
function displayFavoriteCoins() {
    let e = document.getElementById("favorite-coins-list");
    if (e.innerHTML = "", favoriteCoins.length === 0) {
        e.innerHTML = "<p>No favorite coins added yet.</p>";
        return;
    }
    favoriteCoins.forEach(t => {
        let o = t.name || "Unknown Name",
            n = t.symbol || "Unknown Symbol",
            l = formatPrice(t.last_price_usd),
            i = document.createElement("div");
        i.classList.add("coin-card");
        i.onclick = () => selectMainCoin(t);
        i.innerHTML = `
            <div style="margin-bottom: 15px;">
                <img class="coin-image" src="https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${t.image_id}/coin64" alt="${t.name} Image" style="width: 64px; height: 64px;">
                <h3>${o} (${n})</h3>
                <p>Price: ${l}</p>
            </div>
            <div class="buttons-container">
                <button onclick="setAsDefaultCoin(event, '${t.symbol}')">🔄 Set as Default</button>
                <button onclick="viewAlerts(event, '${t.symbol}')">🔔 View Alerts</button>
                <button onclick="editAlerts(event, '${t.symbol}')">✏️ Edit Alerts</button>
                <button onclick="removeFavoriteCoin(event, '${t.symbol}')">🗑️ Remove</button>
            </div>
        `;
        e.appendChild(i);
    });
}

// Search coins
function searchCoins() {
    let e = document.getElementById("search-input").value.toLowerCase();
    if (cachedSearchResults[e]) {
        displayFilteredCoins(cachedSearchResults[e]);
    } else {
        let t = allCoins.filter(t => {
            let o = t.name ? t.name.toLowerCase() : "",
                n = t.symbol ? t.symbol.toLowerCase() : "";
            return o.includes(e) || n.includes(e);
        });
        cachedSearchResults[e] = t;
        displayFilteredCoins(t);
    }
}

// Display filtered coins
function displayFilteredCoins(e) {
    let t = document.getElementById("coins-list");
    t.innerHTML = "";
    e.forEach(e => {
        let o = e.name || "Unknown Name",
            n = e.symbol || "Unknown Symbol",
            l = e.last_price_usd ? `$${parseFloat(e.last_price_usd).toFixed(4)}` : "Price N/A",
            i = document.createElement("div");
        i.classList.add("coin-card");
        i.onclick = () => selectMainCoin(e);
        i.innerHTML = `
            <img class="coin-image" src="https://imagedelivery.net/4-5JC1r3VHAXpnrwWHBHRQ/${e.image_id}/coin64" alt="${e.name} Image">
            <h3>${o} (${n})</h3>
            <p>Price: ${l}</p>
            <button onclick="addFavoriteCoin(event, '${e.symbol}')">⭐ Add to Favorites</button>
            <button onclick="viewAlerts(event, '${e.symbol}')">🔔 View Alerts</button>
            <button onclick="editAlerts(event, '${e.symbol}')">✏️ Edit Alerts</button>
        `;
        t.appendChild(i);
    });
    document.getElementById("page-info").innerText = `Showing ${e.length} results`;
}

// Function to view alerts for a specific coin
function viewAlerts(e, t) {
    e.stopPropagation();
    let o = alerts.filter(e => e.symbol === t);
    if (o.length === 0) {
        showAlert("No alerts set for this coin.");
        return;
    }
    let n = `Alerts for ${t}:\n`;
    o.forEach((e, t) => {
        n += `${t + 1}. ${e.condition} $${e.price}\n`;
    });
    showAlert(n);
}

// Function to edit alerts for a specific coin
async function editAlerts(e, t) {
    e.stopPropagation();
    let o = alerts.filter(e => e.symbol === t);
    if (o.length === 0) {
        showAlert("No alerts to edit for this coin.");
        return;
    }

    let n = await showPrompt("Type 'delete' to remove all alerts or 'add' to add a new alert for this coin:");
    if (n !== null) {
        if (n.toLowerCase() === 'delete') {
            alerts = alerts.filter(e => e.symbol !== t);
            saveAlertsToLocalStorage();
            displayAlerts();
            showAlert(`All alerts for ${t} have been deleted.`);
        } else if (n.toLowerCase() === 'add') {
            let l = await showPrompt("Enter new alert price:");
            if (l !== null && l !== "") {
                let i = await showPrompt("Enter alert condition (above, below, equals, above_equal, below_equal):");
                if (['above', 'below', 'equals', 'above_equal', 'below_equal'].includes(i)) {
                    alerts.push({
                        symbol: t,
                        price: parseFloat(l),
                        condition: i,
                        soundFile: alertSoundFile
                    });
                    saveAlertsToLocalStorage();
                    updateAlertCount();
                    showAlert("New alert added successfully.");
                    displayAlerts();
                } else {
                    showAlert("Invalid condition entered.");
                }
            }
        } else {
            showAlert("Invalid action.");
        }
    }
}

// Function to remove a favorite coin
function removeFavoriteCoin(e, t) {
    e.stopPropagation();
    favoriteCoins = favoriteCoins.filter(e => e.symbol !== t);
    saveFavoritesToLocalStorage();
    displayFavoriteCoins();
    showAlert(`❌ ${t} has been removed from your favorites.`);
}

// Alert functions
async function setMainCoinAlert() {
    if (!selectedCoin) {
        showAlert("No coin selected.");
        return;
    }
    let e = parseFloat(document.getElementById("alert-price").value),
        t = document.getElementById("alert-condition").value;
    if (isNaN(e)) {
        showAlert("Please enter a valid price.");
        return;
    }
    let o = {
        symbol: selectedCoin.symbol,
        price: e,
        condition: t,
        soundFile: alertSoundFile
    };
    addAlert(o);
    showAlert("✅ Alert set successfully.");
    displayAlerts();
}

function addAlert(e) {
    alerts.push(e);
    saveAlertsToLocalStorage();
    updateAlertCount();
}

function displayAlerts() {
    let e = document.getElementById("alerts-list");
    e.innerHTML = "";
    if (alerts.length === 0) {
        e.innerHTML = "<p>No active alerts.</p>";
        updateAlertCount();
        return;
    }
    alerts.forEach((t, o) => {
        let n = document.createElement("div");
        n.classList.add("alert-item");
        n.innerHTML = `
            <p>${t.symbol}: ${t.condition} $${t.price}</p>
            <button onclick="deleteAlert(${o})">🗑️ Delete</button>
        `;
        e.appendChild(n);
    });
    updateAlertCount();
}

function deleteAlert(e) {
    alerts.splice(e, 1);
    saveAlertsToLocalStorage();
    displayAlerts();
}

// Set as default coin
function setAsDefaultCoin(e, t) {
    e.stopPropagation();
    let o = allCoins.find(e => e.symbol === t);
    if (!o) {
        showAlert("Coin not found.");
        return;
    }
    favoriteCoins = favoriteCoins.filter(e => e.symbol !== 'BLS5');
    favoriteCoins.unshift(o);
    saveFavoritesToLocalStorage();
    displayFavoriteCoins();
    selectMainCoin(o);
    showAlert(`${o.name} has been set as the default coin.`);
}

// Sound functions
function previewAlertSound() {
    let e = document.getElementById("alert-sound").value;
    if (e.startsWith("customSound_")) {
        alertSound.src = localStorage.getItem(e);
    } else {
        alertSound.src = `https://www.soundjay.com/button/sounds/${e}`;
    }
    alertSound.loop = true; // Ensure looping
    alertSound.play().catch(error => {
        console.error("Error playing sound:", error);
    });
    document.getElementById("stopSound").style.display = "block";
}

function uploadCustomSound() {
    let e = document.getElementById("custom-sound-upload"),
        t = e.files[0];
    if (!t) {
        showAlert("Please select a sound file to upload.");
        return;
    }
    let o = new FileReader();
    o.onload = function(e) {
        let o = e.target.result,
            n = t.name;
        localStorage.setItem(`customSound_${n}`, o);
        showAlert("📤 Custom sound uploaded successfully.");
        populateSoundOptions();
    };
    o.readAsDataURL(t);
}

function populateSoundOptions() {
    let e = document.getElementById("alert-sound");
    e.innerHTML = `
        <option value="beep-07.mp3">🔊 Beep</option>
        <option value="beep-10.mp3">🔊 Beep 10</option>
        <option value="alert-tone.mp3">🔊 Alert Tone</option>
    `;
    for (let t in localStorage) {
        if (t.startsWith("customSound_")) {
            let o = t.replace("customSound_", "");
            e.innerHTML += `<option value="${t}">${o}</option>`;
        }
    }
}

function stopAlertSound() {
    alertSound.pause();
    alertSound.currentTime = 0;
    alertSound.loop = false; // Disable looping
    document.getElementById("stopSound").style.display = "none";
}

// Alert checking
function checkAlerts() {
    alerts.forEach(e => {
        let t = allCoins.find(t => t.symbol === e.symbol);
        if (!t || !t.last_price_usd) return;
        let o = parseFloat(t.last_price_usd),
            n = false;
        switch (e.condition) {
            case "above":
                n = o > e.price;
                break;
            case "below":
                n = o < e.price;
                break;
            case "equals":
                n = o === e.price;
                break;
            case "above_equal":
                n = o >= e.price;
                break;
            case "below_equal":
                n = o <= e.price;
                break;
            default:
                break;
        }
        if (n) {
            if (!alertSound.paused) {
                console.log("Alert sound is already playing.");
                return;
            }
            if (e.soundFile.startsWith("customSound_")) {
                alertSound.src = localStorage.getItem(e.soundFile);
            } else {
                alertSound.src = `https://www.soundjay.com/button/sounds/${e.soundFile}`;
            }
            alertSound.loop = true; // Enable looping
            alertSound.play().catch(e => {
                console.error("Error playing sound:", e);
            });
            document.getElementById("stopSound").style.display = "block";
        }
    });
}

// Toggle Favorite Coins Section
function toggleFavoriteCoins() {
    let e = document.getElementById("favorite-coins-list"),
        t = document.getElementById("toggle-favorites");
    e.classList.toggle("collapsed");
    t.classList.toggle("rotated");
    if (e.classList.contains("collapsed")) {
        t.innerText = "▼";
    } else {
        t.innerText = "▲";
    }
}

// Remove Favorite Coin
function removeFavoriteCoin(e, t) {
    e.stopPropagation();
    favoriteCoins = favoriteCoins.filter(e => e.symbol !== t);
    saveFavoritesToLocalStorage();
    displayFavoriteCoins();
    showAlert(`❌ ${t} has been removed from your favorites.`);
}

// Local storage functions
function saveFavoritesToLocalStorage() {
    localStorage.setItem("favoriteCoins", JSON.stringify(favoriteCoins));
}

function loadFavoritesFromLocalStorage() {
    let e = localStorage.getItem("favoriteCoins");
    if (e) favoriteCoins = JSON.parse(e);
}

function saveAlertsToLocalStorage() {
    localStorage.setItem("alerts", JSON.stringify(alerts));
}

function loadAlertsFromLocalStorage() {
    let e = localStorage.getItem("alerts");
    if (e) alerts = JSON.parse(e);
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

setInterval(checkAlerts, 60000); // Check every minute
document.getElementById("toggle-favorites").addEventListener("click", toggleFavoriteCoins);
initialize();
