import { zodResolver } from '@hookform/resolvers/zod';
import {
  applyApiErrors,
  Field,
  FormActions,
  FormSection,
  notifySaved,
  PageHeader,
  pickDirty,
  useUnsavedChanges,
} from '@/features/content';
import { ImagePicker } from '@/features/media';
import {
  mediaAssetSchema,
  settingsUpdateSchema,
  type AdminSettings,
  type SettingsUpdateInput,
} from '@tamila/shared';
import { Button, Input, Skeleton, Textarea } from '@tamila/ui';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { useSaveSettings, useSettings } from '../api';

/** Los mismos campos que valida la API, con las imágenes completas en lugar de sus ids. */
const formSchema = settingsUpdateSchema
  .required()
  .omit({ heroImageId: true, ogImageId: true })
  .extend({ heroImage: mediaAssetSchema.nullable(), ogImage: mediaAssetSchema.nullable() });
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const toFormValues = (s: AdminSettings): FormInput => ({
  heroTitle: s.heroTitle,
  heroSubtitle: s.heroSubtitle,
  heroImage: s.heroImage,
  whatsappNumber: s.whatsappNumber,
  whatsappDefaultMessage: s.whatsappDefaultMessage,
  instagramUrl: s.instagramUrl ?? '',
  facebookUrl: s.facebookUrl ?? '',
  tiktokUrl: s.tiktokUrl ?? '',
  businessHours: s.businessHours ?? '',
  footerText: s.footerText ?? '',
  seoTitle: s.seoTitle,
  seoDescription: s.seoDescription,
  ogImage: s.ogImage,
});

export function SettingsPage() {
  const settings = useSettings();
  return (
    <>
      <PageHeader
        title="Configuración"
        description="Datos generales del sitio: portada, contacto, redes, pie de página y buscadores."
      />
      {settings.isPending && <Skeleton className="h-96 w-full" />}
      {settings.isError && (
        <p role="alert" className="text-sm text-destructive">
          {settings.error.message}{' '}
          <Button variant="outline" size="sm" onClick={() => void settings.refetch()}>
            Reintentar
          </Button>
        </p>
      )}
      {settings.data && <SettingsForm settings={settings.data} />}
    </>
  );
}

function SettingsForm({ settings }: { settings: AdminSettings }) {
  const save = useSaveSettings();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting, dirtyFields },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(settings),
  });
  const unsaved = useUnsavedChanges(isDirty);

  const onSubmit = handleSubmit(async (values) => {
    const { heroImage, ogImage, ...rest } = pickDirty(values, dirtyFields);
    const input: SettingsUpdateInput = {
      ...rest,
      ...(heroImage !== undefined && { heroImageId: heroImage?.id ?? null }),
      ...(ogImage !== undefined && { ogImageId: ogImage?.id ?? null }),
    };
    try {
      const saved = await save.mutateAsync(input);
      reset(toFormValues(saved));
      notifySaved();
    } catch (error) {
      applyApiErrors(error, setError, {
        rename: { heroImageId: 'heroImage', ogImageId: 'ogImage' },
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormSection title="Portada (hero)">
        <Field label="Título" error={errors.heroTitle?.message}>
          {(control) => <Input {...control} {...register('heroTitle')} />}
        </Field>
        <Field label="Subtítulo" error={errors.heroSubtitle?.message}>
          {(control) => <Textarea rows={2} {...control} {...register('heroSubtitle')} />}
        </Field>
        <Field
          label="Foto de fondo"
          help="Se muestra en blanco y negro, detrás del título."
          error={errors.heroImage?.message}
        >
          {(aria) => (
            <Controller
              control={control}
              name="heroImage"
              render={({ field }) => (
                <ImagePicker
                  label="Foto de fondo"
                  value={field.value}
                  onChange={field.onChange}
                  optional
                  invalid={aria['aria-invalid']}
                  describedBy={aria['aria-describedby']}
                />
              )}
            />
          )}
        </Field>
      </FormSection>

      <FormSection title="Contacto y redes">
        <Field
          label="WhatsApp"
          help="Formato internacional, solo números, sin + ni espacios: código de país, 9, código de área sin 0 y número sin 15. Ej.: 5491122334455. Vacío oculta los botones."
          error={errors.whatsappNumber?.message}
        >
          {(control) => (
            <Input
              inputMode="numeric"
              autoComplete="off"
              {...control}
              {...register('whatsappNumber')}
            />
          )}
        </Field>
        <Field
          label="Mensaje de WhatsApp por defecto"
          help="Texto con el que se abre la conversación desde el sitio."
          error={errors.whatsappDefaultMessage?.message}
        >
          {(control) => <Textarea rows={2} {...control} {...register('whatsappDefaultMessage')} />}
        </Field>
        {(
          [
            ['instagramUrl', 'Instagram'],
            ['facebookUrl', 'Facebook'],
            ['tiktokUrl', 'TikTok'],
          ] as const
        ).map(([name, label]) => (
          <Field
            key={name}
            label={label}
            help="Link completo, empezando con https://. Vacío no se muestra."
            error={errors[name]?.message}
          >
            {(control) => (
              <Input
                type="url"
                inputMode="url"
                placeholder="https://"
                {...control}
                {...register(name)}
              />
            )}
          </Field>
        ))}
        <Field label="Horario de atención" error={errors.businessHours?.message}>
          {(control) => <Input {...control} {...register('businessHours')} />}
        </Field>
      </FormSection>

      <FormSection title="Pie de página">
        <Field label="Texto del pie de página" error={errors.footerText?.message}>
          {(control) => <Textarea rows={2} {...control} {...register('footerText')} />}
        </Field>
      </FormSection>

      <FormSection title="Buscadores y redes sociales (SEO)">
        <Field
          label="Título para buscadores"
          help="Aparece en la pestaña del navegador y en Google."
          error={errors.seoTitle?.message}
        >
          {(control) => <Input {...control} {...register('seoTitle')} />}
        </Field>
        <Field
          label="Descripción para buscadores"
          help="Una o dos oraciones que resuman qué hace TAMILA y dónde."
          error={errors.seoDescription?.message}
        >
          {(control) => <Textarea rows={3} {...control} {...register('seoDescription')} />}
        </Field>
        <Field
          label="Imagen para redes"
          help="La que se ve al compartir el link del sitio en WhatsApp o redes."
          error={errors.ogImage?.message}
        >
          {(aria) => (
            <Controller
              control={control}
              name="ogImage"
              render={({ field }) => (
                <ImagePicker
                  label="Imagen para redes"
                  value={field.value}
                  onChange={field.onChange}
                  optional
                  invalid={aria['aria-invalid']}
                  describedBy={aria['aria-describedby']}
                />
              )}
            />
          )}
        </Field>
      </FormSection>

      <FormActions isSubmitting={isSubmitting} />
      {unsaved.dialog}
    </form>
  );
}
