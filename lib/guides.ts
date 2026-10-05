export interface GuideSection {
  heading: string;
  paragraphs: string[];
  tips?: string[];
  steps?: { step: number; title: string; description: string }[];
}

export interface Guide {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  readTime: string;
  category: string;
  lead: string;
  sections: GuideSection[];
}

export const guides: Guide[] = [
  {
    slug: 'how-to-find-my-clippings-txt',
    title: 'How to Find My Clippings.txt on Any Amazon Kindle',
    shortTitle: 'Finding My Clippings.txt',
    description: 'A step-by-step walkthrough to locate and copy the My Clippings.txt file from Kindle Paperwhite, Oasis, Basic, and Scribe devices via USB.',
    publishedAt: '2026-03-15',
    updatedAt: '2026-10-04',
    readTime: '4 min read',
    category: 'Hardware & Files',
    lead: 'Whenever you highlight a passage, add a bookmark, or type a note on an Amazon Kindle, the e-reader appends that snippet to a single plain-text file named "My Clippings.txt". Because Amazon keeps this file tucked inside the internal storage, here is how to find and safely extract it on any computer.',
    sections: [
      {
        heading: 'What You Will Need',
        paragraphs: [
          'Before starting, make sure you have your physical Kindle e-reader and a working USB cable. Older Kindles (Paperwhite 1–4, Oasis, older Basic) use Micro-USB, while modern models (Paperwhite 11th Gen+, Kindle 2022, Kindle Scribe) use USB-C.',
        ],
        tips: [
          'Use a full data-transfer USB cable. Many cheap or bundled cables are "charge-only" cables that deliver power without exposing the Kindle drive to your operating system.',
        ],
      },
      {
        heading: 'Step-by-Step Instructions',
        paragraphs: [
          'Follow these steps to connect your device and copy your clippings file without risking any data loss.',
        ],
        steps: [
          {
            step: 1,
            title: 'Connect your Kindle to your computer',
            description: 'Plug the USB cable into your Kindle and your computer. Your Kindle screen will flash and display a message: "Drive Mode" or "Connected as USB Storage". While in this state, you cannot read on the device.',
          },
          {
            step: 2,
            title: 'Open the Kindle storage drive',
            description: 'On Windows, press Win + E to open File Explorer, look under "This PC", and double-click the "Kindle" drive. On macOS, open Finder and look for "Kindle" under Locations in the sidebar. On Linux, mount the Kindle volume using your file manager.',
          },
          {
            step: 3,
            title: 'Navigate to the "documents" directory',
            description: 'Double-click the folder named "documents" (or "Internal Storage > documents"). This directory stores your ebooks, personal documents, and dictionaries.',
          },
          {
            step: 4,
            title: 'Locate "My Clippings.txt"',
            description: 'Look through the documents folder for "My Clippings.txt" (or simply "My Clippings" if file extensions are hidden). It is usually a plain-text file between a few kilobytes and a few megabytes in size.',
          },
          {
            step: 5,
            title: 'Copy the file to your computer',
            description: 'Copy and paste (or drag and drop) the file to your Desktop or Downloads folder. Always COPY the file rather than cutting or moving it, so your Kindle maintains its local copy.',
          },
        ],
      },
      {
        heading: 'Troubleshooting Common Issues',
        paragraphs: [
          'If you cannot see the Kindle drive or the clippings file, check these common pitfalls:',
        ],
        tips: [
          'The Kindle does not appear as a drive: Try a different USB port or another cable. Charge-only cables are the #1 reason devices fail to mount.',
          'Mac users with Kindle Scribe: Newer Kindle models running MTP (Media Transfer Protocol) may require a free helper like OpenMTP or Android File Transfer to view the documents directory in macOS.',
          'Hidden files: On Windows, click View > Show > Hidden items. On macOS, press Cmd + Shift + . (dot) in Finder to reveal any hidden system files.',
          'Sideloaded books vs Store books: Highlights from sideloaded EPUBs/MOBIs and Amazon store books both end up in My Clippings.txt.',
        ],
      },
      {
        heading: 'What to Do Next',
        paragraphs: [
          'Once you have copied My Clippings.txt, you can upload it directly into Kindle Clipper. Our parser will automatically clean up delimiters, remove duplicate revisions, separate books by title, and organize your highlights into an offline-first library.',
        ],
      },
    ],
  },
  {
    slug: 'how-to-read-kindle-highlights-on-phone',
    title: 'How to Read Kindle Highlights on Your Phone (iOS & Android)',
    shortTitle: 'Reading Highlights on Phone',
    description: 'A comprehensive guide on accessing, searching, and reviewing your Kindle book highlights on mobile offline using Kindle Clipper as a PWA.',
    publishedAt: '2026-03-20',
    updatedAt: '2026-10-04',
    readTime: '3 min read',
    category: 'Mobile & PWA',
    lead: 'Reviewing reading highlights while commuting, waiting in line, or traveling is one of the best ways to retain insights. But Amazon Kindle makes reading past highlights on your phone clunky, and third-party apps often lock your notes behind expensive subscription fees. Here is how to read your highlights anywhere on mobile for free.',
    sections: [
      {
        heading: 'Why Amazon’s Mobile Solution Falls Short',
        paragraphs: [
          'Amazon offers a web notebook at read.amazon.com/notebook, but it suffers from severe limitations: it only displays highlights for titles purchased directly from the Amazon Kindle Store. Any sideloaded books, classics from Project Gutenberg, or personal documents sent via "Send to Kindle" are completely omitted.',
          'Furthermore, Amazon’s notebook requires an active internet connection, offers no distraction-free flashcard-style reader mode, and cannot be used offline.',
        ],
      },
      {
        heading: 'Install Kindle Clipper as an Offline Web App',
        paragraphs: [
          'Kindle Clipper is built as a progressive web application (PWA). That means you can install it on your home screen without going through an app store, and all your parsed highlights are cached locally in your browser’s IndexedDB for offline reading.',
        ],
        steps: [
          {
            step: 1,
            title: 'Open the app on your mobile browser',
            description: 'Navigate to https://kindle-clip.vercel.app on Safari (iOS) or Chrome (Android). Log in to your account.',
          },
          {
            step: 2,
            title: 'Add to your Home Screen',
            description: 'On iPhone (Safari): Tap the Share button (the square with an arrow pointing up) at the bottom of the screen, scroll down, and tap "Add to Home Screen". On Android (Chrome): Tap the three dots menu at the top-right and select "Install app" or "Add to Home screen".',
          },
          {
            step: 3,
            title: 'Launch from your phone home screen',
            description: 'Tap the Kindle Clipper icon on your home screen. The app opens in standalone full-screen mode without browser address bars, looking and feeling like a native application.',
          },
        ],
      },
      {
        heading: 'Mobile-Optimized Reading Features',
        paragraphs: [
          'When reading on a mobile device, Kindle Clipper offers features designed specifically for small screens:',
        ],
        tips: [
          'Card Reader Mode: Tap "Read" on any book to enter distraction-free mode. Swipe or tap left/right to browse highlights one by one.',
          'Night and Sepia Themes: Switch between Paper, warm Sepia, and high-contrast Night mode directly from the mobile navigation bar.',
          'Offline Support: Even if you are on a flight or in the subway without cellular service, your entire highlight library remains fully readable and searchable.',
        ],
      },
    ],
  },
  {
    slug: 'how-to-export-kindle-highlights',
    title: 'How to Export Kindle Highlights to Markdown and JSON',
    shortTitle: 'Exporting Highlights',
    description: 'Learn how to backup, export, and convert your raw Kindle clippings into clean Markdown and JSON for Obsidian, Notion, or personal archives.',
    publishedAt: '2026-03-25',
    updatedAt: '2026-10-04',
    readTime: '4 min read',
    category: 'Note Taking & Backup',
    lead: 'Your highlights and reading notes should outlive any single device, app, or platform. In this guide, learn how to export your Kindle clippings into durable, future-proof formats like Markdown and JSON for Obsidian, Notion, Logseq, or plain-text archives.',
    sections: [
      {
        heading: 'The Problem with Raw Kindle Clippings',
        paragraphs: [
          'If you have ever opened My Clippings.txt directly in a text editor, you know how messy it is. Highlights from different books are scrambled together in chronological order, edits create duplicate entries, and Amazon inserts repetitive metadata lines like "- Your Highlight on page 42 | location 642-644 | Added on Saturday, 14 May 2026 10:22:15".',
          'Attempting to manually paste this into Obsidian or Notion requires hours of tedious cleanup.',
        ],
      },
      {
        heading: 'Exporting Clean Markdown from Kindle Clipper',
        paragraphs: [
          'Kindle Clipper provides one-click export for every book in your collection. Here is the workflow:',
        ],
        steps: [
          {
            step: 1,
            title: 'Open the book in your library',
            description: 'From your Kindle Clipper library, select the book whose highlights you want to export.',
          },
          {
            step: 2,
            title: 'Select Export',
            description: 'Click the "Export" button near the book title. You can choose Markdown (.md) or JSON (.json).',
          },
          {
            step: 3,
            title: 'Download the file',
            description: 'A clean, well-formatted file will be generated immediately, with metadata in YAML frontmatter, quotes formatted as blockquotes, and your personal notes attached directly to their corresponding passages.',
          },
        ],
      },
      {
        heading: 'Using Your Highlights in Obsidian and Notion',
        paragraphs: [
          'Here is how to integrate your exported files into popular knowledge-management systems:',
        ],
        tips: [
          'Obsidian: Drag the exported .md file directly into your Obsidian vault folder. The YAML frontmatter makes it instantly compatible with Dataview and the graph view.',
          'Notion: Open a new page in Notion, click the "..." menu at the top right, select "Import", and choose "Markdown & CSV". Notion will preserve headings, quotes, and italics.',
          'Long-term Archiving: Markdown is plain text. It will remain readable decades from now on any operating system, without requiring proprietary software.',
        ],
      },
    ],
  },
];

export function getAllGuides(): Guide[] {
  return guides;
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
