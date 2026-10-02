import { Button, cn, Input, Label, Progress } from '@tamila/ui';
import { CircleAlert, CircleCheck, ImagePlus, Loader2, RotateCcw, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { ACCEPT_ATTR, type UploadItem, type useUploadQueue } from './useUploadQueue';

type Queue = ReturnType<typeof useUploadQueue>;

/**
 * Elegir fotos (galería o cámara en el celular, o arrastrarlas en la compu), escribir el texto
 * alternativo de cada una y subirlas viendo el progreso.
 */
export function UploadQueue({ queue }: { queue: Queue }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          queue.addFiles(event.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 text-center',
          dragging && 'border-brand-text bg-accent',
        )}
      >
        <ImagePlus aria-hidden className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Elegí fotos de la galería o sacá una con la cámara.
          <span className="hidden md:inline"> También podés arrastrarlas acá.</span>
        </p>
        <Label htmlFor={inputId} className="sr-only">
          Elegir fotos
        </Label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) queue.addFiles(event.target.files);
            event.target.value = '';
          }}
        />
        <Button type="button" className="min-h-11" onClick={() => inputRef.current?.click()}>
          <ImagePlus aria-hidden /> Elegir fotos
        </Button>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP o AVIF. Las fotos se suben enteras; las muy grandes se achican solas.
        </p>
      </div>

      {queue.items.length > 0 && (
        <>
          <ul aria-label="Fotos para subir" className="flex flex-col gap-3">
            {queue.items.map((item) => (
              <UploadRow key={item.key} item={item} queue={queue} />
            ))}
          </ul>
          <div className="flex flex-wrap justify-end gap-2">
            {queue.items.some((i) => i.status === 'lista') && (
              <Button type="button" variant="outline" onClick={queue.clearDone}>
                Limpiar las subidas
              </Button>
            )}
            <Button
              type="button"
              className="min-h-11"
              disabled={queue.pendingCount === 0 || queue.busy}
              onClick={() => void queue.start()}
            >
              {queue.busy && <Loader2 aria-hidden className="animate-spin" />}
              {queue.pendingCount === 1 ? 'Subir 1 foto' : `Subir ${queue.pendingCount} fotos`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function UploadRow({ item, queue }: { item: UploadItem; queue: Queue }) {
  const altId = useId();
  const locked = item.status !== 'pendiente' && item.status !== 'error';
  return (
    <li className="flex gap-3 rounded-lg border p-3" aria-label={item.file.name}>
      <img
        src={item.previewUrl}
        alt=""
        className="size-20 shrink-0 rounded-md bg-muted object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={altId} className="text-xs">
            Texto alternativo de {item.file.name}
          </Label>
          <Input
            id={altId}
            value={item.alt}
            disabled={locked}
            placeholder="Ej.: living con piso flotante terminado"
            onChange={(event) => queue.setAlt(item.key, event.target.value)}
          />
        </div>
        <UploadStatusLine item={item} />
      </div>
      <div className="flex flex-col gap-1">
        {item.status === 'error' && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={`Reintentar ${item.file.name}`}
            onClick={() => queue.retry(item.key)}
          >
            <RotateCcw aria-hidden />
          </Button>
        )}
        {!locked && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={`Quitar ${item.file.name}`}
            onClick={() => queue.remove(item.key)}
          >
            <X aria-hidden />
          </Button>
        )}
      </div>
    </li>
  );
}

function UploadStatusLine({ item }: { item: UploadItem }) {
  switch (item.status) {
    case 'pendiente':
      return <p className="text-xs text-muted-foreground">Lista para subir</p>;
    case 'subiendo':
      return (
        <div className="flex flex-col gap-1" role="status">
          <Progress
            value={Math.round(item.progress * 100)}
            aria-label={`Subiendo ${item.file.name}`}
          />
          <p className="text-xs text-muted-foreground">
            Subiendo… {Math.round(item.progress * 100)}%
          </p>
        </div>
      );
    case 'procesando':
      return (
        <p role="status" className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 aria-hidden className="size-3 animate-spin" /> Optimizando la imagen…
        </p>
      );
    case 'lista':
      return (
        <p role="status" className="flex items-center gap-1 text-xs font-medium">
          <CircleCheck aria-hidden className="size-4" /> Subida
        </p>
      );
    case 'error':
      return (
        <p role="alert" className="flex items-start gap-1 text-xs text-destructive">
          <CircleAlert aria-hidden className="mt-0.5 size-3 shrink-0" /> {item.error}
        </p>
      );
  }
}
