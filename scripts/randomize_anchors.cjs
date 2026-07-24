const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'LandingPageView.jsx');
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

const startTag = '// @@ANCHOR_RANDOMIZER_START@@';
const endTag = '// @@ANCHOR_RANDOMIZER_END@@';

const startIdx = content.indexOf(startTag);
const endIdx = content.indexOf(endTag);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find anchor randomizer tags in LandingPageView.jsx');
  process.exit(1);
}

const toursBlock = content.substring(startIdx + startTag.length, endIdx).trim();

// Strip out the variable declaration to get the raw array
const arrayStartIdx = toursBlock.indexOf('[');
const arrayEndIdx = toursBlock.lastIndexOf(']');

if (arrayStartIdx === -1 || arrayEndIdx === -1) {
  console.error('Could not parse the tours array.');
  process.exit(1);
}

const rawArrayStr = toursBlock.substring(arrayStartIdx, arrayEndIdx + 1);

// Safely evaluate the array using Function constructor
let tours;
try {
  tours = new Function(`return ${rawArrayStr}`)();
} catch (e) {
  console.error('Error evaluating tours array:', e.message);
  process.exit(1);
}

if (!Array.isArray(tours)) {
  console.error('Parsed tours object is not an array.');
  process.exit(1);
}

// Randomize titles based on anchorVariations
console.log('Randomizing anchor texts (titles) for sitemap tours...');
tours.forEach(tour => {
  if (tour.anchorVariations && tour.anchorVariations.length > 0) {
    const randomIdx = Math.floor(Math.random() * tour.anchorVariations.length);
    const oldTitle = tour.title;
    const newTitle = tour.anchorVariations[randomIdx];
    tour.title = newTitle;
    console.log(`- "${tour.id}": "${oldTitle}" -> "${newTitle}"`);
  }
});

// Format the array back into pretty JS string (preserving list format)
function formatArray(arr) {
  let out = 'const TOURS_DATA = [\n';
  arr.forEach((item, index) => {
    out += '  {\n';
    out += `    id: '${item.id}',\n`;
    out += `    title: '${item.title.replace(/'/g, "\\'")}',\n`;
    out += `    url: '${item.url}',\n`;
    out += `    image: '${item.image}',\n`;
    out += `    category: '${item.category}',\n`;
    out += `    price: ${item.price},\n`;
    out += `    rating: ${item.rating},\n`;
    out += `    reviews: ${item.reviews},\n`;
    out += `    desc: '${item.desc.replace(/'/g, "\\'")}',\n`;
    
    // Inclusions
    out += '    inclusions: [\n';
    item.inclusions.forEach(inc => {
      out += `      '${inc.replace(/'/g, "\\'")}',\n`;
    });
    out += '    ],\n';
    
    // Anchor variations
    out += '    anchorVariations: [\n';
    item.anchorVariations.forEach(v => {
      out += `      '${v.replace(/'/g, "\\'")}',\n`;
    });
    out += '    ]\n';
    
    out += '  }';
    if (index < arr.length - 1) {
      out += ',\n';
    } else {
      out += '\n';
    }
  });
  out += '];';
  return out;
}

const formattedBlock = `${startTag}\n${formatArray(tours)}\n${endTag}`;
content = content.substring(0, startIdx) + formattedBlock + content.substring(endIdx + endTag.length);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully randomized anchor texts in LandingPageView.jsx!');
