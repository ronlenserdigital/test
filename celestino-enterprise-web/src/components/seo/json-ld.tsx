/**
 * Serializes a JSON-LD graph into a script tag. `<` is escaped to prevent
 * `</script>` injection from any string content.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
