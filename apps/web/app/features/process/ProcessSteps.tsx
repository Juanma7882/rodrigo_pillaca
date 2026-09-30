import type { ProcessStep } from '@tamila/shared';
import { twoDigits } from '~/shared/format';
import { Reveal, SectionHeader } from '~/shared/ui';

/** "Cómo trabajamos": pasos numerados en el orden configurado. */
export function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
  if (steps.length === 0) return null;
  return (
    <section
      id="como-trabajamos"
      aria-labelledby="proceso-titulo"
      className="scroll-mt-16 border-t bg-muted"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
        <SectionHeader
          folio="Proceso"
          title="Cómo trabajamos"
          id="proceso-titulo"
          intro="De la primera consulta a la entrega, cada paso claro y por escrito."
        />
        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {steps.map((step, index) => (
            <Reveal
              as="li"
              key={step.order}
              className="flex flex-col gap-3 border-t-2 border-foreground pt-5"
            >
              <span className="font-display text-5xl leading-none font-black text-brand-text">
                {twoDigits(index + 1)}
              </span>
              <h3 className="text-lg font-extrabold uppercase">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
