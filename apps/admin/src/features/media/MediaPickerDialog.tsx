import type { AdminMedia, MediaAsset } from '@tamila/shared';
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@tamila/ui';
import { Check } from 'lucide-react';
import { useId, useState } from 'react';
import { useMediaLibrary } from './api/media';
import { MediaThumb } from './MediaThumb';
import { UploadQueue } from './UploadQueue';
import { useUploadQueue } from './useUploadQueue';

type MediaPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Galerías: se eligen varias y se confirman con "Agregar". */
  multiple?: boolean;
  /** Imágenes que ya están en el campo (no se vuelven a ofrecer en una galería). */
  excludeIds?: string[];
  onPick: (media: MediaAsset[]) => void;
};

/**
 * Elegir imágenes de la biblioteca o subir nuevas sin salir del formulario. En el celular ocupa
 * toda la pantalla. Lo que se sube queda elegido.
 */
export function MediaPickerDialog(props: MediaPickerDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="flex h-svh max-w-none flex-col gap-4 overflow-y-auto rounded-none sm:h-auto sm:max-h-[90svh] sm:max-w-3xl sm:rounded-lg">
        {props.open && <PickerBody {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function PickerBody({
  onOpenChange,
  title,
  multiple = false,
  excludeIds = [],
  onPick,
}: MediaPickerDialogProps) {
  const [tab, setTab] = useState('library');
  const [unused, setUnused] = useState(false);
  const [selected, setSelected] = useState<MediaAsset[]>([]);
  const switchId = useId();
  const library = useMediaLibrary(unused);
  const items = (library.data?.pages.flatMap((p) => p.items) ?? []).filter(
    (m) => !excludeIds.includes(m.id),
  );

  const finish = (media: MediaAsset[]) => {
    onPick(media);
    onOpenChange(false);
  };
  const toggle = (media: AdminMedia) => {
    if (!multiple) return finish([media]);
    setSelected((current) =>
      current.some((m) => m.id === media.id)
        ? current.filter((m) => m.id !== media.id)
        : [...current, media],
    );
  };

  const queue = useUploadQueue({
    onUploaded: (media) => {
      if (multiple) setSelected((current) => [...current, media]);
      else finish([media]);
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {multiple
            ? 'Elegí una o varias fotos de la biblioteca o subí nuevas.'
            : 'Elegí una foto de la biblioteca o subí una nueva.'}
        </DialogDescription>
      </DialogHeader>

      <Tabs value={tab} onValueChange={setTab} className="flex-1">
        <TabsList>
          <TabsTrigger value="library">Biblioteca</TabsTrigger>
          <TabsTrigger value="upload">Subir</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="flex flex-col gap-3 pt-3">
          <div className="flex items-center gap-2">
            <Switch id={switchId} checked={unused} onCheckedChange={setUnused} />
            <Label htmlFor={switchId} className="font-normal">
              Solo las que no se usan
            </Label>
          </div>
          <ul aria-label="Imágenes para elegir" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {library.isPending &&
              Array.from({ length: 6 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="aspect-[4/3] w-full rounded-md" />
                </li>
              ))}
            {items.map((media) => {
              const isSelected = selected.some((m) => m.id === media.id);
              return (
                <li key={media.id}>
                  <button
                    type="button"
                    onClick={() => toggle(media)}
                    aria-pressed={multiple ? isSelected : undefined}
                    aria-label={`Elegir ${media.alt}`}
                    className={cn(
                      'relative block w-full rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      isSelected && 'ring-4 ring-primary',
                    )}
                  >
                    <MediaThumb image={media} sizes="(min-width: 640px) 15rem, 45vw" />
                    {isSelected && (
                      <span className="absolute top-2 right-2 rounded-full bg-primary p-1 text-primary-foreground">
                        <Check aria-hidden className="size-4" />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {!library.isPending && items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay imágenes para elegir. Subí una desde la pestaña "Subir".
            </p>
          )}
          {library.hasNextPage && (
            <Button
              type="button"
              variant="outline"
              className="self-center"
              disabled={library.isFetchingNextPage}
              onClick={() => void library.fetchNextPage()}
            >
              Cargar más
            </Button>
          )}
        </TabsContent>

        <TabsContent value="upload" className="pt-3">
          <UploadQueue queue={queue} />
        </TabsContent>
      </Tabs>

      {multiple && (
        <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background pt-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={selected.length === 0} onClick={() => finish(selected)}>
            {selected.length === 1 ? 'Agregar 1 foto' : `Agregar ${selected.length} fotos`}
          </Button>
        </div>
      )}
    </>
  );
}
