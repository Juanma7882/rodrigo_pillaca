import { PageHeader } from '@/features/content';
import { processStepCreateSchema, processStepUpdateSchema } from '@tamila/shared';
import { stepsApi } from '../api';
import { SectionEditor } from '../SectionEditor';

export function ProcessStepsPage() {
  return (
    <>
      <PageHeader
        title="Cómo trabajamos"
        description="Los pasos del proceso, en orden. Arrastrá desde el asa para cambiarlo."
      />
      <SectionEditor
        api={stepsApi}
        fields={[
          { name: 'title', label: 'Título' },
          { name: 'description', label: 'Descripción', multiline: true },
        ]}
        createSchema={processStepCreateSchema}
        updateSchema={processStepUpdateSchema}
        itemLabel={(step) => String(step.title)}
        singular="Paso"
        addLabel="Agregar paso"
        listLabel="Pasos"
      />
    </>
  );
}
