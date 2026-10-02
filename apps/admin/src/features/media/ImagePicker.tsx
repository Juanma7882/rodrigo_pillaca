import { SortableList } from '@/features/content';
import type { MediaAsset } from '@tamila/shared';
import { Button, cn } from '@tamila/ui';
import { ImageOff, ImagePlus, Trash2 } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { MediaThumb } from './MediaThumb';

// El selector (biblioteca + subida) se descarga recién al abrirlo.
const MediaPickerDialog = lazy(() =>
  import('./MediaPickerDialog').then((m) => ({ default: m.MediaPickerDialog })),
);

type ImagePickerProps = {
  /** Nombre del campo (título del selector y nombres accesibles). */
  label: string;
  value: MediaAsset | null;
  onChange: (media: MediaAsset | null) => void;
  /** Un campo opcional se puede vaciar. */
  optional?: boolean;
  invalid?: boolean;
  describedBy?: string;
};

/** Campo de una imagen: muestra la elegida y abre el selector para cambiarla. */
export function ImagePicker({
  label,
  value,
  onChange,
  optional = false,
  invalid = false,
  describedBy,
}: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center',
        invalid && 'border-destructive',
      )}
      aria-describedby={describedBy}
    >
      {value ? (
        <MediaThumb
          image={value}
          className="w-full sm:w-48"
          sizes="(min-width: 640px) 12rem, 90vw"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-md bg-muted text-muted-foreground sm:w-48">
          <ImageOff aria-hidden className="size-6" />
          <span className="sr-only">Sin imagen</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="min-h-11" onClick={() => setOpen(true)}>
          <ImagePlus aria-hidden />{' '}
          {value ? `Cambiar ${label.toLowerCase()}` : `Elegir ${label.toLowerCase()}`}
        </Button>
        {optional && value && (
          <Button type="button" variant="ghost" className="min-h-11" onClick={() => onChange(null)}>
            <Trash2 aria-hidden /> Quitar
          </Button>
        )}
      </div>
      {open && (
        <Suspense fallback={null}>
          <MediaPickerDialog
            open={open}
            onOpenChange={setOpen}
            title={label}
            onPick={([media]) => media && onChange(media)}
          />
        </Suspense>
      )}
    </div>
  );
}

type GalleryFieldProps = {
  label: string;
  value: MediaAsset[];
  onChange: (media: MediaAsset[]) => void;
  invalid?: boolean;
  describedBy?: string;
};

/** Galería: varias imágenes, ordenables arrastrando, que se agregan o quitan de a una. */
export function GalleryField({
  label,
  value,
  onChange,
  invalid = false,
  describedBy,
}: GalleryFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn('flex flex-col gap-3 rounded-lg border p-3', invalid && 'border-destructive')}
      aria-describedby={describedBy}
    >
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay fotos en la galería.</p>
      ) : (
        <SortableList
          label={label}
          items={value}
          getLabel={(media) => media.alt}
          onReorder={onChange}
          renderItem={(media, handle) => (
            <div className="flex items-center gap-2 rounded-md border bg-background p-2">
              {handle}
              <MediaThumb image={media} className="w-24 shrink-0" sizes="6rem" />
              <span className="min-w-0 flex-1 truncate text-sm">{media.alt}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={`Quitar ${media.alt} de la galería`}
                onClick={() => onChange(value.filter((m) => m.id !== media.id))}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          )}
        />
      )}
      <Button
        type="button"
        variant="outline"
        className="min-h-11 self-start"
        onClick={() => setOpen(true)}
      >
        <ImagePlus aria-hidden /> Agregar fotos
      </Button>
      {open && (
        <Suspense fallback={null}>
          <MediaPickerDialog
            open={open}
            onOpenChange={setOpen}
            title={label}
            multiple
            excludeIds={value.map((m) => m.id)}
            onPick={(media) => onChange([...value, ...media])}
          />
        </Suspense>
      )}
    </div>
  );
}
