document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    const allCoinsButton = document.getElementById('getAllCoins');
    if (allCoinsButton) {
      console.log('All Coins button found');
      allCoinsButton.addEventListener('click', async () => {
        console.log('All Coins button clicked');
        try {
          const data = await fetchData('https://coincodex.com/apps/coincodex/cache/all_coins.json');
          console.log('Fetched all coins data:', data);
          // Here, you can add code to update the UI with the fetched data
        } catch (error) {
          console.error('Error fetching all coins data:', error);
        }
      });
    } else {
      console.log('All Coins button not found');
    }
  });

  // Save files as part of the Chrome extension structure
const fs = require('fs');
console.log('Saving manifest.json');
fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
console.log('Saving background.js');
fs.writeFileSync('background.js', "chrome.runtime.onInstalled.addListener(() => { console.log('Crypto API Extension Installed'); });");
console.log('Saving content.js');
fs.writeFileSync('content.js', `${fetchData.toString()}`);
console.log('Saving popup.html');
fs.writeFileSync('popup.html', popupHtml);
console.log('Saving popup.js');
fs.writeFileSync('popup.js', `document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  const allCoinsButton = document.getElementById('getAllCoins');
  if (allCoinsButton) {
    console.log('All Coins button found');
    allCoinsButton.addEventListener('click', async () => {
      console.log('All Coins button clicked');
      try {
        const data = await fetchData('https://coincodex.com/apps/coincodex/cache/all_coins.json');
        console.log('Fetched all coins data:', data);
      } catch (error) {
        console.error('Error fetching all coins data:', error);
      }
    });
  } else {
    console.log('All Coins button not found');
  }
});`);