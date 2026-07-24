const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

let html = fs.readFileSync(filePath, 'utf8');

const tours = [
  {
    url: 'https://roaradventuretourism.com/tour/evening-desert-safari/',
    variations: [
      'Evening Desert Safari',
      'Evening Desert Safari Dubai',
      'VIP Evening Desert Safari Deals',
      'Dubai Evening Safari Tour 2026',
      'Desert Safari with BBQ Dinner'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/vip-desert-safari-in-dubai/',
    variations: [
      'VIP Desert Safari in Dubai',
      'VIP Desert Safari Dubai Deals',
      'Luxury Desert Safari Dubai',
      'VIP Safari with Sofa Seating',
      'VIP Desert Camp Dubai'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/private-desert-safari-dubai/',
    variations: [
      'Private Desert Safari Dubai',
      'Private 4x4 Desert Safari',
      'Exclusive Private Safari Dubai',
      'Private Family Desert Safari',
      'Custom Private Desert Tour'
    ]
  }
];

const startTag = '<!-- @@SITEMAP_START@@ -->';
const endTag = '<!-- @@SITEMAP_END@@ -->';

const startIdx = html.indexOf(startTag);
const endIdx = html.indexOf(endTag);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find sitemap randomizer tags in index.html');
  process.exit(1);
}

// Generate randomized HTML block with ONLY the 3 allowed tours
console.log('Randomizing sitemap anchors for static index.html (3 allowed tours only)...');
let sitemapHtml = `${startTag}\n      <div class="lp-footer-directory">\n        <h4 class="lp-directory-title">Roar Adventure Tourism LLC - Sitemap Tour Index</h4>\n        <div class="lp-directory-tags">\n`;

tours.forEach((tour, idx) => {
  const randomIdx = Math.floor(Math.random() * tour.variations.length);
  const selectedText = tour.variations[randomIdx];
  console.log(`- Tag ${idx}: ${selectedText}`);
  sitemapHtml += `          <a href="${tour.url}" target="_blank" rel="noopener noreferrer" class="lp-directory-tag" id="tag_${idx}">${selectedText}</a>\n`;
});

sitemapHtml += `        </div>\n      </div>\n      ${endTag}`;

// Overwrite the block in HTML
html = html.substring(0, startIdx) + sitemapHtml + html.substring(endIdx + endTag.length);
fs.writeFileSync(filePath, html, 'utf8');

console.log('Successfully randomized sitemap anchors in index.html!');
