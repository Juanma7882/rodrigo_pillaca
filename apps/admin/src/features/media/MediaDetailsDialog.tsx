import { ApiError } from '@/features/auth';
import { ConfirmDialog, notifySaved } from '@/features/content';
import { mediaUpdateSchema, type AdminMedia } from '@tamila/shared';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  toast,
} from '@tamila/ui';
import { Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { formatBytes, usageLink, useDeleteMedia, useUpdateMedia } from './api/media';
import { MediaThumb } from './MediaThumb';

/** Detalle de una imagen: dónde se usa, texto alternativo, crédito y borrado. */
export function MediaDetailsDialog({
  media,
  onClose,
}: {
  media: AdminMedia | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!media} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        {media && <MediaDetails key={media.id} media={media} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function MediaDetails({ media, onClose }: { media: AdminMedia; onClose: () => void }) {
  const altId = useId();
  const creditId = useId();
  const [alt, setAlt] = useState(media.alt);
  const [credit, setCredit] = useState(media.credit ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const update = useUpdateMedia();
  const remove = useDeleteMedia();

  const save = () => {
    const parsed = mediaUpdateSchema.safeParse({ alt, credit });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Revisá los datos');
      return;
    }
    setFieldError(null);
    update.mutate(
      { id: media.id, input: parsed.data },
      {
        onSuccess: () => notifySaved('Imagen actualizada'),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar'),
      },
    );
  };

  const confirmRemove = () =>
    remove.mutate(media.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        toast.success('Imagen borrada');
        onClose();
      },
      onError: (error) => {
        setConfirmDelete(false);
        setDeleteError(error instanceof ApiError ? error.message : 'No se pudo borrar la imagen');
      },
    });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Imagen</DialogTitle>
        <DialogDescription>
          {media.width} × {media.height} px · {formatBytes(media.totalBytes)} en total
        </DialogDescription>
      </DialogHeader>

      <MediaThumb image={media} sizes="(min-width: 640px) 32rem, 90vw" />

      <section aria-label="Dónde se usa" className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">Dónde se usa</h2>
        {media.usages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No la usa ningún contenido.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {media.usages.map((usage) => (
              <li key={`${usage.kind}-${usage.id}`}>
                <Link
                  to={usageLink(usage)}
                  onClick={onClose}
                  className="font-medium text-brand-text underline underline-offset-4"
                >
                  {usage.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor={altId}>Texto alternativo</Label>
          <Textarea
            id={altId}
            value={alt}
            rows={2}
            aria-invalid={!!fieldError}
            aria-describedby={`${altId}-help`}
            onChange={(event) => setAlt(event.target.value)}
          />
          <p
            id={`${altId}-help`}
            className={fieldError ? 'text-sm text-destructive' : 'text-xs text-muted-foreground'}
          >
            {fieldError ?? 'Describí la foto para quien no la ve. Se usa en todo el sitio.'}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={creditId}>Crédito (opcional)</Label>
          <Input id={creditId} value={credit} onChange={(event) => setCredit(event.target.value)} />
        </div>
        {deleteError && (
          <p
            role="alert"
            className="rounded-md border border-destructive p-3 text-sm text-destructive"
          >
            {deleteError}
          </p>
        )}
        <div className="flex flex-wrap justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 text-destructive"
            onClick={() => {
              setDeleteError(null);
              setConfirmDelete(true);
            }}
          >
            <Trash2 aria-hidden /> Borrar
          </Button>
          <Button type="submit" className="min-h-11" disabled={update.isPending}>
            {update.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="¿Borrar la imagen?"
        description={
          media.usages.length > 0
            ? `Esta imagen se usa en: ${media.usages.map((u) => u.label).join(', ')}. Primero hay que reemplazarla ahí.`
            : 'Se borra de la biblioteca y del servidor. No se puede deshacer.'
        }
        confirmLabel="Borrar"
        destructive
        pending={remove.isPending}
        onConfirm={confirmRemove}
      />
    </>
  );
}
