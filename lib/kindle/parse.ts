

export type EntryType = 'highlight' | 'note' | 'bookmark';

export interface ParsedEntry {
  title: string;
  author: string | null;
  type: EntryType;
  page: number | null;
  locStart: number;
  locEnd: number;
  addedAt: Date | null;
  text: string;
}

export function parseClippings(raw: string): ParsedEntry[] {
  // Strip BOM
  let content = raw.replace(/^\uFEFF/, '');
  // Normalize line endings to \n
  content = content.replace(/\r\n/g, '\n');
  
  const blocks = content.split('==========\n');
  const entries: ParsedEntry[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');
    if (lines.length < 2) continue;

    // Line 1: Title and Author
    let titleLine = lines[0].trim();
    // Some titles might start with BOM (since BOM can appear at start of titles somehow)
    titleLine = titleLine.replace(/^\uFEFF/, '').trim();
    
    let title = titleLine;
    let author: string | null = null;
    
    // Find last parenthesized group for author
    const authorMatch = titleLine.match(/(.*)\s+\(([^)]+)\)$/);
    if (authorMatch) {
      title = authorMatch[1].trim();
      let authorName = authorMatch[2].trim();
      if (authorName.toLowerCase() === 'unknown' || authorName === '') {
        author = null;
      } else {
        author = authorName;
      }
    }

    // Line 2: Metadata
    const metaLine = lines[1].trim();
    
    // - Your Highlight on page 6 | location 78-79 | Added on Saturday, 18 November 2023 10:58:06
    // - Your Highlight at location 135 | Added on Monday, 20 November 2023 12:00:00
    
    // Type
    let type: EntryType = 'highlight';
    if (metaLine.includes('Note')) type = 'note';
    else if (metaLine.includes('Bookmark')) type = 'bookmark';

    // Page
    let page: number | null = null;
    const pageMatch = metaLine.match(/page (\d+)/);
    if (pageMatch) {
      page = parseInt(pageMatch[1], 10);
    }

    // Location
    let locStart = 0;
    let locEnd = 0;
    const locMatch = metaLine.match(/location (\d+)(?:-(\d+))?/);
    if (locMatch) {
      locStart = parseInt(locMatch[1], 10);
      locEnd = locMatch[2] ? parseInt(locMatch[2], 10) : locStart;
    }

    // Date
    let addedAt: Date | null = null;
    const dateMatch = metaLine.match(/Added on (.+)$/);
    if (dateMatch) {
      let dateStr = dateMatch[1].trim();
      // Example: Saturday, 18 November 2023 10:58:06
      // Try to parse using date-fns or native Date
      try {
        // Native date can usually handle this format if we remove the weekday
        const noWeekday = dateStr.replace(/^[a-zA-Z]+,\s*/, '');
        const parsed = new Date(noWeekday);
        if (!isNaN(parsed.getTime())) {
          addedAt = parsed;
        }
      } catch (e) {
        addedAt = null;
      }
    }

    // Text: everything from line 3 onwards
    // Wait, line 2 is empty often
    // Actually the format is:
    // Line 1: Title (Author)
    // Line 2: - Metadata
    // Line 3: (empty)
    // Line 4+: Text
    
    let textStartIndex = 2;
    if (lines[2] && lines[2].trim() === '') {
      textStartIndex = 3;
    }
    
    const text = lines.slice(textStartIndex).join('\n').trim();

    entries.push({
      title,
      author,
      type,
      page,
      locStart,
      locEnd,
      addedAt,
      text
    });
  }

  return entries;
}
