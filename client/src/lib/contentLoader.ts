import type { CardData } from '../components/ContentCard';

// Import content files as raw strings using Vite's ?raw import
import heroContent from '../content/about/hero.md?raw';
import storyContent from '../content/about/story.md?raw';
import featuresContent from '../content/about/features.md?raw';
import ctaContent from '../content/about/cta.md?raw';

/**
 * Parse inline markdown (bold, italic, links)
 */
function parseInlineMarkdown(text: string): string {
  return text
    // Bold (**text**)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic (*text* or _text_)
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

/**
 * Extract emoji from end of text
 */
function extractEmoji(text: string): { text: string; emoji: string } {
  // Check for emoji at the end (emojis are typically 2 UTF-16 code units)
  const lastTwo = text.slice(-2);
  const code = lastTwo.codePointAt(0);
  if (code && code >= 0x1F300 && code <= 0x1F9FF) {
    return { text: text.slice(0, -2).trim(), emoji: lastTwo };
  }
  return { text: text.trim(), emoji: '' };
}

/**
 * Parse markdown content into a card
 * Handles the specific format of the about content files
 */
function parseCardMarkdown(markdown: string, defaultTitle: string, defaultEmoji: string): CardData {
  const lines = markdown.split('\n');
  const elements: HTMLElement[] = [];

  let title = defaultTitle;
  let emoji = defaultEmoji;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines and h1
    if (!line || line.startsWith('# ')) {
      i++;
      continue;
    }

    // Handle ## Headline section - extract title from next line
    if (line === '## Headline') {
      i++;
      // Look for the actual headline content (usually bold with emoji)
      while (i < lines.length) {
        const contentLine = lines[i].trim();
        if (contentLine && !contentLine.startsWith('#')) {
          // Parse bold text and emoji
          const match = contentLine.match(/^\*\*(.+?)\*\*\s*(.+)?$/);
          if (match) {
            const extracted = extractEmoji(match[1]);
            title = extracted.text;
            if (extracted.emoji) emoji = extracted.emoji;

            // Create paragraph with the headline
            const p = document.createElement('p');
            p.innerHTML = parseInlineMarkdown(contentLine);
            elements.push(p);
          } else {
            const p = document.createElement('p');
            p.innerHTML = parseInlineMarkdown(contentLine);
            elements.push(p);
          }
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // Handle ## Subheadline - just a section marker, skip
    if (line === '## Subheadline') {
      i++;
      continue;
    }

    // Handle other ## headers - create as section headers
    if (line.startsWith('## ')) {
      const headerText = line.replace('## ', '');
      // Skip common section markers that aren't content
      if (['Headline', 'Subheadline', 'CTA Text', 'Come Say Hi', 'GitHub', 'Connect'].includes(headerText)) {
        i++;
        continue;
      }

      const h3 = document.createElement('h3');
      h3.textContent = headerText;
      elements.push(h3);
      i++;
      continue;
    }

    // Handle ### headers
    if (line.startsWith('### ')) {
      const h3 = document.createElement('h3');
      h3.textContent = line.replace('### ', '');
      elements.push(h3);
      i++;
      continue;
    }

    // Handle unordered lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const ul = document.createElement('ul');
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        const li = document.createElement('li');
        const listText = lines[i].trim().replace(/^[-*] /, '');
        // Parse **bold** for list items
        const boldMatch = listText.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
        if (boldMatch) {
          li.innerHTML = `<strong>${boldMatch[1]}</strong>: ${parseInlineMarkdown(boldMatch[2])}`;
        } else {
          li.innerHTML = parseInlineMarkdown(listText);
        }
        ul.appendChild(li);
        i++;
      }
      elements.push(ul);
      continue;
    }

    // Handle regular paragraphs
    if (line) {
      const p = document.createElement('p');
      let paragraphText = line;

      // Collect multi-line paragraphs
      while (i + 1 < lines.length && lines[i + 1].trim() && !lines[i + 1].trim().startsWith('#') && !lines[i + 1].trim().startsWith('-') && !lines[i + 1].trim().startsWith('*')) {
        i++;
        paragraphText += ' ' + lines[i].trim();
      }

      p.innerHTML = parseInlineMarkdown(paragraphText);
      elements.push(p);
    }

    i++;
  }

  return {
    id: `card-${defaultTitle.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    emoji,
    content: elements,
  };
}

/**
 * Load all about content and convert to cards
 * Uses Vite's ?raw imports for bundling at build time
 */
export function loadAboutContent(): CardData[] {
  return [
    parseCardMarkdown(heroContent, 'Yo, I\'m Cleetus', '🤡'),
    parseCardMarkdown(storyContent, 'The Origin Story', '📖'),
    parseCardMarkdown(featuresContent, 'What Cleetus Does', '✨'),
    parseCardMarkdown(ctaContent, 'Come Say Hi', '🚀'),
  ];
}
