import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export interface FieldDescriptor {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  validation?: z.ZodType;
}

export interface FormDescriptor {
  title: string;
  fields: FieldDescriptor[];
  submitLabel?: string;
  cancelLabel?: string;
}

interface DynamicFormProps {
  descriptor: FormDescriptor;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
  defaultValues?: Record<string, unknown>;
}

export const DynamicForm = ({ descriptor, onSubmit, onCancel, defaultValues }: DynamicFormProps) => {
  const schemaFields: Record<string, z.ZodType> = {};
  descriptor.fields.forEach((field) => {
    if (field.validation) {
      schemaFields[field.name] = field.validation;
    } else {
      let schema: z.ZodType = z.string();
      if (field.type === 'number') schema = z.number();
      if (field.type === 'checkbox') schema = z.boolean();
      if (field.type === 'email') schema = z.string().email();
      if (field.required) schema = (schema as z.ZodString).min(1, `${field.label} is required`);
      schemaFields[field.name] = schema;
    }
  });

  const schema = z.object(schemaFields);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const renderField = (field: FieldDescriptor) => {
    const error = errors[field.name];
    const errorMessage = error?.message as string;

    const baseInputClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${
      error
        ? 'border-[var(--color-error)]'
        : 'border-[var(--color-border)] bg-[var(--color-surface)]'
    } text-[var(--color-text)]`;

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              {field.label}
              {field.required && <span className="text-[var(--color-error)] ml-1">*</span>}
            </label>
            <select {...register(field.name)} className={baseInputClasses}>
              <option value="">Select...</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errorMessage && (
              <p className="mt-1 text-sm text-[var(--color-error)]">{errorMessage}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="mb-4 flex items-center">
            <input
              type="checkbox"
              {...register(field.name)}
              className="w-4 h-4 text-[var(--color-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary)]"
            />
            <label className="ml-2 text-sm text-[var(--color-text)]">{field.label}</label>
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              {field.label}
              {field.required && <span className="text-[var(--color-error)] ml-1">*</span>}
            </label>
            <textarea
              {...register(field.name)}
              placeholder={field.placeholder}
              rows={4}
              className={baseInputClasses}
            />
            {errorMessage && (
              <p className="mt-1 text-sm text-[var(--color-error)]">{errorMessage}</p>
            )}
          </div>
        );

      default:
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              {field.label}
              {field.required && <span className="text-[var(--color-error)] ml-1">*</span>}
            </label>
            <input
              type={field.type}
              {...register(field.name, {
                valueAsNumber: field.type === 'number',
              })}
              placeholder={field.placeholder}
              className={baseInputClasses}
            />
            {errorMessage && (
              <p className="mt-1 text-sm text-[var(--color-error)]">{errorMessage}</p>
            )}
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">{descriptor.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          {descriptor.fields.map(renderField)}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 mt-4 md:mt-6">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} className="text-sm md:text-base">
                {descriptor.cancelLabel || 'Cancel'}
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="text-sm md:text-base">
              {isSubmitting ? 'Submitting...' : descriptor.submitLabel || 'Submit'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
