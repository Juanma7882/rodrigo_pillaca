import { Label } from '@tamila/ui';
import { useId, type ReactNode } from 'react';

export type FieldControlProps = {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
};

type FieldProps = {
  label: string;
  /** Texto de ayuda permanente debajo del campo (formato esperado, ejemplo…). */
  help?: ReactNode;
  error?: string;
  /** Recibe los atributos de accesibilidad para el control (input, textarea…). */
  children: (control: FieldControlProps) => ReactNode;
};

/** Campo de formulario con etiqueta, ayuda y error asociados al control. */
export function Field({ label, help, error, children }: FieldProps) {
  const id = useId();
  const helpId = help ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy })}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
      {help && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {help}
        </p>
      )}
    </div>
  );
}

/** Bloque de un formulario con título (en el celular, las secciones van una debajo de otra). */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border p-4 md:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
