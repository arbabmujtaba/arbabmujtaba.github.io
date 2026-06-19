/**
 * FieldRenderer - given a SectionField definition and value, renders
 * the appropriate field component dynamically.
 */

import type { SectionField } from '../../../lib/sections';
import TextField from './TextField';
import TextAreaField from './TextAreaField';
import MarkdownField from './MarkdownField';
import ImageField from './ImageField';
import GalleryField from './GalleryField';
import LinkField from './LinkField';
import SelectField from './SelectField';
import NumberField from './NumberField';
import BooleanField from './BooleanField';
import DateField from './DateField';
import TagsField from './TagsField';

interface FieldRendererProps {
  field: SectionField;
  value: any;
  onChange: (value: any) => void;
  collection: string;
  error?: string;
}

export default function FieldRenderer({
  field,
  value,
  onChange,
  collection,
  error,
}: FieldRendererProps) {
  switch (field.type) {
    case 'text':
      return (
        <TextField
          name={field.name}
          label={field.label}
          value={value ?? ''}
          onChange={onChange}
          placeholder={field.placeholder}
          required={field.required}
          error={error}
        />
      );
    case 'textarea':
      return (
        <TextAreaField
          name={field.name}
          label={field.label}
          value={value ?? ''}
          onChange={onChange}
          placeholder={field.placeholder}
          required={field.required}
          error={error}
        />
      );
    case 'markdown':
      return (
        <MarkdownField
          name={field.name}
          label={field.label}
          value={value ?? ''}
          onChange={onChange}
          placeholder={field.placeholder}
          required={field.required}
          error={error}
        />
      );
    case 'image':
      return (
        <ImageField
          name={field.name}
          label={field.label}
          value={value ?? ''}
          onChange={onChange}
          collection={collection}
          required={field.required}
          error={error}
        />
      );
    case 'gallery':
      return (
        <GalleryField
          name={field.name}
          label={field.label}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          collection={collection}
          required={field.required}
          error={error}
        />
      );
    case 'link':
      return (
        <LinkField
          name={field.name}
          label={field.label}
          value={value ?? ''}
          onChange={onChange}
          placeholder={field.placeholder}
          required={field.required}
          error={error}
        />
      );
    case 'select':
      return (
        <SelectField
          name={field.name}
          label={field.label}
          value={value ?? ''}
          onChange={onChange}
          options={field.options ?? []}
          required={field.required}
          error={error}
        />
      );
    case 'number':
      return (
        <NumberField
          name={field.name}
          label={field.label}
          value={typeof value === 'number' ? value : Number(value) || 0}
          onChange={onChange}
          required={field.required}
          error={error}
        />
      );
    case 'boolean':
      return (
        <BooleanField
          name={field.name}
          label={field.label}
          value={Boolean(value)}
          onChange={onChange}
          error={error}
        />
      );
    case 'date':
      return (
        <DateField
          name={field.name}
          label={field.label}
          value={value ?? ''}
          onChange={onChange}
          required={field.required}
          error={error}
        />
      );
    case 'tags':
      return (
        <TagsField
          name={field.name}
          label={field.label}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          placeholder={field.placeholder}
          required={field.required}
          error={error}
        />
      );
    default:
      return (
        <TextField
          name={field.name}
          label={field.label}
          value={String(value ?? '')}
          onChange={onChange}
          required={field.required}
          error={error}
        />
      );
  }
}
