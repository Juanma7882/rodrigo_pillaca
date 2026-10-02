import { Label, Switch } from '@tamila/ui';
import { useId } from 'react';

type PublishSwitchProps = {
  checked: boolean;
  onCheckedChange: (published: boolean) => void;
  /** Nombre del elemento, para que el interruptor se entienda fuera de contexto. */
  itemName?: string;
  disabled?: boolean;
};

/** Interruptor "Publicado / No publicado": oculta o muestra algo en el sitio sin borrarlo. */
export function PublishSwitch({
  checked,
  onCheckedChange,
  itemName,
  disabled = false,
}: PublishSwitchProps) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-center gap-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={itemName ? `Publicar ${itemName}` : undefined}
      />
      <Label htmlFor={id} className="text-sm font-normal text-muted-foreground">
        {checked ? 'Publicado' : 'No publicado'}
      </Label>
    </div>
  );
}
