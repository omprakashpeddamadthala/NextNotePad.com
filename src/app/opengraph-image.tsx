import { ImageResponse } from "next/og";

export const alt =
  "NextNotePad — free online notepad and text editor in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "linear-gradient(135deg, #0a0d1a 0%, #1b1f3a 100%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 40,
          color: "#a5b4fc",
          marginBottom: 24,
        }}
      >
        NextNotePad.com
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 76,
          fontWeight: 700,
          lineHeight: 1.1,
          maxWidth: 960,
        }}
      >
        Free online notepad and text editor
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 34,
          color: "#cbd5e1",
          marginTop: 32,
          maxWidth: 960,
        }}
      >
        Tabs, folders, autosave and syntax highlighting. No install. No account
        required.
      </div>
    </div>,
    size,
  );
}
