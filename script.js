
    const API_URL = "http://localhost:3000/api/all_coins";
    const alertSound = document.getElementById("alertSound");

    let allCoins = [];
    let currentPage = 1;
    const coinsPerPage = 10;
    let selectedCoin = null;
    let alertPrice = null;

    // Fetch coins and display the default selected coin
    async function fetchCoins() {
        try {
            console.log("Fetching coins...");
            const response = await fetch(API_URL);
            allCoins = await response.json();
            console.log(allCoins); // Log the full response for debugging
            
            // Automatically select the default coin when the page loads
            selectDefaultCoin();
            displayCoins();
        } catch (error) {
            console.error("Error fetching coin data:", error);
        }
    }

    // Function to select the default coin
    function selectDefaultCoin() {
        // Set the default coin as "BloodLoop (BLS5)"
        const defaultCoinSymbol = "BLS5";
        const defaultCoin = allCoins.find(coin => coin.symbol === defaultCoinSymbol);

        if (defaultCoin) {
            selectMainCoin(defaultCoin);
        } else {
            console.log(`Default coin with symbol ${defaultCoinSymbol} not found.`);
        }
    }

    // Function to display all coins
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

            // Create the coin div
            const coinDiv = document.createElement("div");
            coinDiv.classList.add("coin");
            coinDiv.onclick = () => selectMainCoin(coin);
            coinDiv.innerHTML = `<h3>${coinName} (${coinSymbol})</h3><p>Price: ${price}</p>`;

            // Append the coin div to the container
            coinsContainer.appendChild(coinDiv);
        });

        document.getElementById("page-info").innerText = `Page ${currentPage} of ${Math.ceil(allCoins.length / coinsPerPage)}`;
    }

    // Function to handle pagination
    function nextPage() {
        if (currentPage * coinsPerPage < allCoins.length) {
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

    // Function to select a main coin for display
    function selectMainCoin(coin) {
        selectedCoin = coin;
        document.getElementById("selected-coin-name").innerText = `${coin.name || "Unknown"} (${coin.symbol || "Unknown"})`;
        document.getElementById("selected-coin-price").innerText = coin.last_price_usd ? `$${parseFloat(coin.last_price_usd).toFixed(2)}` : "Price N/A";
    }

    // Function to set a price alert for the selected coin
    function setMainCoinAlert() {
        const priceInput = document.getElementById("alert-price").value;
        if (selectedCoin && priceInput) {
            alertPrice = parseFloat(priceInput);
            alert(`Alert set for ${selectedCoin.name} at $${alertPrice}`);
        } else {
            alert("Please select a coin and enter a valid alert price.");
        }
    }

    // Function to check if the price meets the alert condition
    async function checkMainCoinPrice() {
        if (selectedCoin && alertPrice) {
            try {
                const response = await fetch(`https://coincodex.com/api/coincodex/get_coin/${selectedCoin.symbol}`);
                const coinData = await response.json();
                const currentPrice = parseFloat(coinData.last_price_usd);
                
                document.getElementById("selected-coin-price").innerText = `$${currentPrice.toFixed(2)}`;

                if ((currentPrice <= alertPrice && alertPrice < selectedCoin.last_price_usd) ||
                    (currentPrice >= alertPrice && alertPrice > selectedCoin.last_price_usd)) {
                    alertSound.play();
                    alert(`${selectedCoin.name} has reached your alert price of $${currentPrice.toFixed(2)}!`);
                    alertPrice = null; // Reset alert price after notification
                }
            } catch (error) {
                console.error("Error fetching coin price data:", error);
            }
        }
    }

    // Function to search for coins
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

            // Create the coin div
            const coinDiv = document.createElement("div");
            coinDiv.classList.add("coin");
            coinDiv.onclick = () => selectMainCoin(coin);
            coinDiv.innerHTML = `<h3>${coinName} (${coinSymbol})</h3><p>Price: ${price}</p>`;

            // Append the coin div to the container
            coinsContainer.appendChild(coinDiv);
        });

        document.getElementById("page-info").innerText = `Showing ${filteredCoins.length} results`;
    }

    // Initial coin fetch and set interval to check the main coin's price every 5 minutes
    fetchCoins();
    setInterval(checkMainCoinPrice, 300000); // 5 minutes in milliseconds
