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
    url: 'https://roaradventuretourism.com/tour/premium-desert-safari/',
    variations: [
      'Premium Desert Safari',
      'Premium Desert Safari Dubai',
      'Premium Safari with Quadbike',
      'Luxury Red Dunes Safari Package',
      'Premium Campsite Dinner Tour'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/morning-desert-safari-in-dubai/',
    variations: [
      'Morning Desert Safari in Dubai',
      'Morning Desert Safari Dubai',
      'Morning Safari with Camel Ride',
      'Early Morning Desert Safari',
      'Morning Safari In Al Awir'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/overnight-desert-safari-dubai/',
    variations: [
      'Overnight Desert Safari Dubai',
      'Sleep in Desert Safari Package',
      'Overnight Camping Safari Dubai',
      'Desert Camping with Breakfast',
      '24 Hour Desert Safari Dubai'
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
  },
  {
    url: 'https://roaradventuretourism.com/tour/dune-buggy-in-dubai/',
    variations: [
      'Dune Buggy in Dubai',
      'Dubai Dune Buggy Rental',
      'Can-Am Buggy Tour Dubai',
      'Self Drive Dune Buggy Dubai',
      'Offroad Buggy Tour Lahbab'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/polaris-rzr-1000cc-dune-buggy-dubai/',
    variations: [
      'Polaris RZR 1000cc Dune Buggy Dubai',
      'Polaris RZR Dune Buggy Dubai 1000 CC',
      'Polaris 1000cc Buggy Ride',
      'Polaris RZR Red Dunes Rental',
      'High Performance Polaris Buggy'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/quad-bike-tour-in-dubai/',
    variations: [
      'Quad Bike Tour in Dubai',
      'Single Quad Bike Adventure',
      'Dubai Quad Biking Tour',
      'All Terrain Quad Bike Dubai',
      'Open Desert Quad Biking Ride'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/dubai-city-tour/',
    variations: [
      'Dubai City Tour',
      'Dubai City Tour Booking',
      'Dubai Guided Sightseeing Tour',
      'Half Day Dubai City Tour',
      'Dubai Landmarks Tour'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/book-abu-dhabi-city-tour/',
    variations: [
      'Abu Dhabi City Tour',
      'Book Abu Dhabi City Tour',
      'Abu Dhabi Day Trip from Dubai',
      'Grand Mosque Tour Abu Dhabi',
      'Abu Dhabi Guided Sightseeing'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/sharjah-city-tour/',
    variations: [
      'Sharjah City Tour',
      'Sharjah Guided City Tour',
      'Sharjah Cultural Heritage Tour',
      'Sightseeing Tour in Sharjah',
      'Sharjah Museum Tour'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/hatta-day-trip-with-mountain-tour/',
    variations: [
      'Hatta Day Trip with Mountain Tour',
      'Hatta Mountain Tour from Dubai',
      'Hatta Kayaking & Heritage Tour',
      'Hatta Day Trip Booking',
      'Dubai to Hatta Mountain Excursion'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/dubai-marina-cruise-dinner/',
    variations: [
      'Dubai Marina Cruise Dinner',
      'Marina Yacht Dinner Cruise',
      'Luxury Marina Cruise Dubai',
      'Marina Buffet Cruise Dinner',
      'Dubai Marina Dhow Cruise'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/dhow-cruise-dinner-in-dubai/',
    variations: [
      'Dhow Cruise Dinner in Dubai',
      'Creek Dhow Cruise Dinner',
      'Traditional Dhow Cruise Buffet',
      'Creek Yacht Buffet Dinner',
      'Dubai Creek Dhow Cruise Dinner'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/hot-air-balloon-ride-dubai/',
    variations: [
      'Hot Air Balloon Ride Dubai',
      'Sunrise Hot Air Balloon Flight',
      'Luxury Balloon Ride over Desert',
      'Hot Air Balloon Dubai Booking',
      'Dubai Desert Hot Air Balloon Tour'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/camel-riding-safari-dubai/',
    variations: [
      'Camel Riding Safari Dubai',
      'Desert Safari with Camel Ride',
      'Traditional Camel Caravan Dubai',
      'Camel Trekking Tour Dubai',
      'Bedouin Camel Riding Safari'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/dubai-desert-safari-without-dune-bashing/',
    variations: [
      'Dubai Desert Safari without Dune Bashing',
      'Desert Safari without Dune Bashing',
      'Safari for Pregnant Ladies Dubai',
      'Gentle Desert Safari Dubai',
      'Safari for Seniors Citizens'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/vip-desert-safari-with-quad-bike/',
    variations: [
      'VIP Desert Safari with Quad Bike',
      'VIP Safari with Quad Bike Ride',
      'VIP Quad Biking Safari Dubai',
      'Luxury Safari and Quad Bike',
      'VIP Red Dunes Quad Safari'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/dune-buggy-adventure-in-dubai/',
    variations: [
      'Dune Buggy Adventure in Dubai',
      'Self Drive Buggy Rental Dubai',
      'Dune Buggy Adventure Ride',
      'Offroad Buggy Excursion Dubai',
      'Desert Buggy Ride Lahbab'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/dubai-desert-safari-with-quad-bike/',
    variations: [
      'Dubai Desert Safari with Quad Bike',
      'Desert Safari with Quad Bike Ride',
      'Evening Safari and Quad Bike',
      'Red Dunes Safari with ATV',
      'Dubai Quad Biking Safari Deal'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/morning-desert-safari-with-quadbike/',
    variations: [
      'Morning Desert Safari with Quadbike',
      'Morning Safari With Quadbike',
      'Morning Quad Bike Safari Dubai',
      'Early Morning ATV Tour',
      'Morning Red Dunes ATV Ride'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/evening-desert-safari-with-bbq-dinner/',
    variations: [
      'Evening Desert Safari with BBQ Dinner',
      'Evening Safari with BBQ Dinner',
      'Campsite BBQ Safari Dubai',
      'Red Dunes Buffet Safari Dinner',
      'Evening Desert Safari Package'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/dune-bashing-adventure-in-dubai/',
    variations: [
      'Dune Bashing Adventure in Dubai',
      'Dune Bashing Adventure Dubai',
      'Extreme Dune Bashing Dubai',
      'High Dunes Drifting Excursion',
      '4x4 Sand Dune Drifting Tour'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/red-dunes-safari/',
    variations: [
      'Red Dunes Safari',
      'Premium Red Dunes Safari',
      'Lahbab Red Dunes Desert Safari',
      'Al Lahbab Desert Safari Dubai',
      'Red Sand Dunes Safari Tour'
    ]
  },
  {
    url: 'https://roaradventuretourism.com/tour/sunrise-desert-safari-dubai/',
    variations: [
      'Sunrise Desert Safari Dubai',
      'Sunrise Desert Safari',
      'Early Morning Sunrise Safari',
      'Sunrise Red Dunes Photography',
      'Sunrise Safari with Camel Ride'
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

// Generate randomized HTML block
console.log('Randomizing anchor texts for static index.html...');
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
