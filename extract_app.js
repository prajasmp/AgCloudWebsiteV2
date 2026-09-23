import fs from 'fs';
const filePath = 'C:\\Users\\r2637\\.gemini\\antigravity-ide\\brain\\a11f8e18-a24e-4642-b6ee-2a1589b10dd0\\.system_generated\\steps\\632\\content.md';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match string literals that look like component JSX text or titles
  const regex = />([^<]{3,120})</g;
  let match;
  const strings = new Set();
  while ((match = regex.exec(content)) !== null) {
    const trimmed = match[1].trim();
    if (trimmed && !trimmed.startsWith('{') && !trimmed.startsWith('function')) {
      strings.add(trimmed);
    }
  }
  console.log('Found JSX text nodes:', strings.size);
  console.log(Array.from(strings).slice(0, 80));
}
