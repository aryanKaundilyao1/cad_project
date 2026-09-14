const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/index.css');
let content = fs.readFileSync(filePath, 'utf8');

// Replace .dark mapping with identical values to :root so the user's OS setting doesn't unexpectedly flip the entire site colors!
// The brand is Ethereal Green canvas. We want it everywhere.

const rootValues = `
    /* Primary Canvas: Ethereal Green (#F1ECCA) -> HSL(52, 53%, 87%) */
    --background: 52 53% 87%;
    
    /* Body Text: Dark Ink / Dark Surf the Web */
    --foreground: 222 60% 12%;

    /* Accent / Buttons: Surf the Web (#203C7F) -> HSL(222, 60%, 31%) */
    --primary: 222 60% 31%;
    --primary-foreground: 52 53% 87%;

    /* Cards/Surface: Ethereal Green or slight tint */
    --card: 52 40% 90%; 
    --card-foreground: 222 60% 12%;

    --popover: 52 53% 87%;
    --popover-foreground: 222 60% 12%;

    /* Secondary subtle areas */
    --secondary: 52 30% 82%;
    --secondary-foreground: 222 60% 12%;

    --muted: 52 30% 80%;
    --muted-foreground: 222 30% 40%;

    --accent: 222 60% 31%;
    --accent-foreground: 52 53% 87%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 52 53% 87%;

    /* Borders: Subtle Surf the Web */
    --border: 222 60% 31%;
    --input: 222 30% 70%;
    --ring: 222 60% 31%;
`;

content = content.replace(/\.dark \{[\s\S]*?\}/, `.dark { ${rootValues} }`);
content = content.replace(/--background: 222 60% 31%;/g, "--background: 52 53% 87%;"); // failsafe

// Add a specific inverted class for sections
content = content + `\n
@layer utilities {
  .section-inverted {
    background-color: hsl(222 60% 31%);
    color: hsl(52 53% 87%);
  }
  .section-inverted * {
    border-color: hsl(52 53% 87% / 0.2);
  }
  .section-inverted .text-foreground {
    color: hsl(52 53% 87%);
  }
  .section-inverted .text-primary {
    color: hsl(52 53% 87%);
  }
}
`;

fs.writeFileSync(filePath, content, 'utf8');
