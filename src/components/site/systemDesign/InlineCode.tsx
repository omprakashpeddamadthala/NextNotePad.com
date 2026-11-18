/** Renders a prose string, turning `backtick` spans into <code>. */
export function InlineCode({ text }: { text: string }) {
  const parts = text.split("`");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <code key={i}>{part}</code> : part,
      )}
    </>
  );
}
