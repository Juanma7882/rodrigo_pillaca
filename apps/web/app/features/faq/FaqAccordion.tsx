import type { Faq } from '@tamila/shared';
import { cn } from '@tamila/ui';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { SectionHeader } from '~/shared/ui';

/** Preguntas frecuentes en acordeón accesible (botones con aria-expanded). */
export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (faqs.length === 0) return null;

  return (
    <section id="preguntas" aria-labelledby="preguntas-titulo" className="scroll-mt-16 border-t">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-12 md:py-28">
        <div className="md:col-span-5">
          <SectionHeader
            folio="Consultas"
            title="Preguntas frecuentes"
            id="preguntas-titulo"
            size="md"
          />
        </div>
        <ul className="border-t md:col-span-7">
          {faqs.map((faq) => {
            const expanded = open === faq.id;
            return (
              <li key={faq.id} className="border-b">
                <h3>
                  <button
                    type="button"
                    id={`pregunta-${faq.id}`}
                    aria-expanded={expanded}
                    aria-controls={`respuesta-${faq.id}`}
                    onClick={() => setOpen(expanded ? null : faq.id)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {faq.question}
                    <Plus
                      aria-hidden
                      className={cn(
                        'size-5 shrink-0 text-brand-text transition-transform motion-reduce:transition-none',
                        expanded && 'rotate-45',
                      )}
                    />
                  </button>
                </h3>
                <div
                  id={`respuesta-${faq.id}`}
                  role="region"
                  aria-labelledby={`pregunta-${faq.id}`}
                  hidden={!expanded}
                  className="pb-5 text-muted-foreground"
                >
                  {faq.answer}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
