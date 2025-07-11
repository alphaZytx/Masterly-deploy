const fs = require('fs');
const path = require('path');

// Allow file path as a command-line argument, default to test.concepts.json
const filePath = process.argv[2] || path.join(__dirname, 'test.concepts.json');
const outputPath = path.join(path.dirname(filePath), 'test.concepts.with-linear-prereq.json');

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

// Read the concepts file
let concepts = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// Remove any null or undefined entries
concepts = concepts.filter(c => c && typeof c === 'object');

// Set prerequisites: first concept gets [], others get previous concept's _id.$oid
if (concepts.length > 0) {
  concepts[0].prerequisites = [];
  for (let i = 1; i < concepts.length; i++) {
    const prevId = concepts[i - 1]._id && concepts[i - 1]._id.$oid;
    concepts[i].prerequisites = prevId ? [prevId] : [];
  }
}

// Remove any null/undefined from prerequisites arrays, make empty if any nulls present
for (let i = 0; i < concepts.length; i++) {
  if (Array.isArray(concepts[i].prerequisites)) {
    const filtered = concepts[i].prerequisites.filter(x => x != null);
    if (filtered.length !== concepts[i].prerequisites.length) {
      concepts[i].prerequisites = [];
    } else {
      concepts[i].prerequisites = filtered;
    }
  }
}

// Write the updated concepts to a new file
fs.writeFileSync(outputPath, JSON.stringify(concepts, null, 2), 'utf-8');

console.log(`Linear prerequisites added (each concept has previous conceptId as prerequisite). Output written to ${outputPath}`);