/**
 * Questions answered on the homepage, below the editor. Plain strings so the
 * same text feeds both the visible answers and the FAQPage structured data.
 * Every answer must stay inside the verified capability list in docs/seo/audit.md.
 */
export const HOME_FAQ: { question: string; answer: string }[] = [
  {
    question: "Is NextNotePad free?",
    answer:
      "Yes. The editor and all of its features are free, and you can start writing without creating an account.",
  },
  {
    question: "Where are my notes saved?",
    answer:
      "Without an account, in your browser's storage on the device you are using, so clearing site data removes them. After you sign in with Google, they are saved as files in a NextNotePad.com folder in your own Google Drive.",
  },
  {
    question: "Can NextNotePad read my Google Drive?",
    answer:
      "No. The app asks for Google's drive.file permission, which only gives it access to files it created. Your other Drive files stay out of reach.",
  },
  {
    question: "Does it work on phones and tablets?",
    answer:
      "Yes. It runs in any modern browser on Windows, macOS, Linux, ChromeOS, Android and iOS, and you can install it as a web app for its own icon.",
  },
  {
    question: "Does it work offline?",
    answer:
      "Yes, after your first visit. Open NextNotePad once while online and your browser keeps a copy of the editor, so it opens without internet from then on. Notes written without an account are saved on your device.",
  },
];
