const fs = require('fs');
const content = fs.readFileSync('bundle_dump.txt', 'utf8');

// Find index of custom app code (after react vendor)
// Let's search for "Power your world", "Minecraft", "Anti-DDoS", "Discord", "Refund", "Terms", "Plans"
const termsToSearch = [
  "Power your world",
  "AG Cloud",
  "Minecraft",
  "VPS",
  "Bot Hosting",
  "Refund",
  "Terms",
  "Contact",
  "Discord",
  "Explore Plans",
  "99.9%",
  "Anti-DDoS",
  "Low Ping"
];

termsToSearch.forEach(term => {
  let idx = content.indexOf(term);
  console.log(`Term "${term}": found at index ${idx}`);
  if (idx !== -1) {
    console.log("Context:\n", content.substring(Math.max(0, idx - 150), Math.min(content.length, idx + 400)));
    console.log("-----------------------------------");
  }
});
