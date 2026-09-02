/** Only rendered from verified case studies. */
export function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <figure className="rounded-lg border border-line bg-surface-1 p-7">
      <blockquote className="text-lg text-fg">“{quote}”</blockquote>
      <figcaption className="mt-4 text-sm text-fg-muted">
        <span className="font-medium text-fg-2">{name}</span> · {role}
      </figcaption>
    </figure>
  );
}
