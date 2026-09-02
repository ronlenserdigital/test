import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { AccordionItem } from "@/components/ui/accordion";
import type { FAQ } from "@/content/types";

export function FAQSection({ faqs, title = "Questions buyers ask", eyebrow = "FAQ", theme = "light" }: { faqs: FAQ[]; title?: string; eyebrow?: string; theme?: "light" | "dark" }) {
  if (!faqs.length) return null;
  return (
    <Section theme={theme} spacing="default" className="hairline-t">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="border-t border-line">
          {faqs.map((f) => (
            <AccordionItem key={f.question} title={f.question}>
              <p className="text-base leading-relaxed">{f.answer}</p>
            </AccordionItem>
          ))}
        </div>
      </Container>
    </Section>
  );
}
