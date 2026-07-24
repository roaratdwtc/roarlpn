const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

let html = fs.readFileSync(filePath, 'utf8');

// Regex to find all href attributes linking to roaradventuretourism.com tours
// e.g. href="https://roaradventuretourism.com/tour/..."
const hrefRegex = /href="https:\/\/roaradventuretourism\.com\/tour\/([^"]+)"/g;

const allowedTours = [
  'evening-desert-safari/',
  'vip-desert-safari-in-dubai/',
  'private-desert-safari-dubai/'
];

let replacedCount = 0;
html = html.replace(hrefRegex, (match, tourPath) => {
  if (allowedTours.includes(tourPath)) {
    return match; // Keep allowed links
  } else {
    replacedCount++;
    return 'href="#"'; // Replace other links with '#'
  }
});

fs.writeFileSync(filePath, html, 'utf8');
console.log(`Successfully replaced ${replacedCount} other tour links with '#' in index.html!`);
