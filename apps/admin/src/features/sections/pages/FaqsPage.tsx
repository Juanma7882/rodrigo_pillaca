import { PageHeader } from '@/features/content';
import { faqCreateSchema, faqUpdateSchema } from '@tamila/shared';
import { faqsApi } from '../api';
import { SectionEditor } from '../SectionEditor';

export function FaqsPage() {
  return (
    <>
      <PageHeader
        title="Preguntas frecuentes"
        description="Se muestran en el inicio, en este orden. Las no publicadas quedan ocultas."
      />
      <SectionEditor
        api={faqsApi}
        fields={[
          { name: 'question', label: 'Pregunta' },
          { name: 'answer', label: 'Respuesta', multiline: true },
        ]}
        createSchema={faqCreateSchema}
        updateSchema={faqUpdateSchema}
        publishable
        itemLabel={(faq) => String(faq.question)}
        singular="Pregunta"
        addLabel="Agregar pregunta"
        listLabel="Preguntas"
      />
    </>
  );
}
