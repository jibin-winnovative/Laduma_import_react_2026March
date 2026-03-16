# Dynamic UI System Guide

The Import Management System includes a powerful dynamic UI rendering system that allows you to generate tables and forms from JSON descriptors. This enables AI-driven UI generation and rapid prototyping.

## Overview

The dynamic UI system consists of three main components:

1. **DynamicRenderer** - Main orchestrator that routes to specific renderers
2. **DynamicTable** - Renders data tables from descriptors
3. **DynamicForm** - Renders forms from descriptors

## Usage

### Basic Example

```tsx
import { DynamicRenderer } from './components/dynamic/DynamicRenderer';
import { companiesTableDescriptor } from './utils/sampleDescriptors';

function MyPage() {
  return (
    <DynamicRenderer
      components={[companiesTableDescriptor]}
      onAction={(actionType, data) => {
        console.log('Action:', actionType, data);
      }}
    />
  );
}
```

## Table Descriptor

### Structure

```typescript
{
  type: 'table',
  id: 'unique-id',
  title: 'My Table',
  descriptor: {
    title: 'Companies',
    endpoint: '/api/Companies',
    columns: [
      {
        key: 'name',
        label: 'Company Name',
        type: 'text'
      },
      {
        key: 'isActive',
        label: 'Status',
        type: 'boolean',
        format: (value) => value ? 'Active' : 'Inactive'
      }
    ],
    actions: {
      create: true,
      edit: true,
      delete: true,
      view: true
    },
    keyField: 'id'
  }
}
```

### Column Types

- `text` - Plain text display
- `number` - Numeric values
- `date` - Auto-formatted dates
- `boolean` - Yes/No display
- Custom via `format` function

### Actions

Enable CRUD operations:

```typescript
actions: {
  create: true,   // Show "Add New" button
  edit: true,     // Show edit icon per row
  delete: true,   // Show delete icon per row
  view: true      // Show view icon per row
}
```

### Handling Actions

```tsx
const handleAction = (actionType: string, data?: unknown) => {
  switch (actionType) {
    case 'create':
      // Open create modal
      break;
    case 'edit':
      // Open edit modal with data
      break;
    case 'delete':
      // Confirm and delete
      break;
    case 'view':
      // Navigate to detail view
      break;
  }
};

<DynamicRenderer components={descriptors} onAction={handleAction} />
```

## Form Descriptor

### Structure

```typescript
{
  type: 'form',
  id: 'create-company-form',
  title: 'Create Company',
  descriptor: {
    title: 'Create New Company',
    submitLabel: 'Create',
    cancelLabel: 'Cancel',
    fields: [
      {
        name: 'name',
        label: 'Company Name',
        type: 'text',
        required: true,
        placeholder: 'Enter company name'
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true
      },
      {
        name: 'country',
        label: 'Country',
        type: 'select',
        options: [
          { label: 'South Africa', value: 'ZA' },
          { label: 'United States', value: 'US' }
        ]
      },
      {
        name: 'isActive',
        label: 'Active',
        type: 'checkbox'
      }
    ]
  }
}
```

### Field Types

- `text` - Single-line text input
- `email` - Email input with validation
- `number` - Numeric input
- `date` - Date picker
- `select` - Dropdown select
- `checkbox` - Boolean checkbox
- `textarea` - Multi-line text input

### Validation

Built-in validation using Zod:

```typescript
{
  name: 'email',
  label: 'Email',
  type: 'email',
  required: true,
  validation: z.string().email('Invalid email')
}
```

### Form Submission

```tsx
<DynamicForm
  descriptor={formDescriptor}
  onSubmit={(data) => {
    console.log('Form submitted:', data);
    // Call API to save data
  }}
  onCancel={() => console.log('Cancelled')}
  defaultValues={{ name: 'Pre-filled value' }}
/>
```

## Complete Example: Companies CRUD

```tsx
import { useState } from 'react';
import { DynamicRenderer } from './components/dynamic/DynamicRenderer';
import { Modal } from './components/ui/Modal';
import { DynamicForm } from './components/dynamic/DynamicForm';

const companiesTable = {
  type: 'table',
  id: 'companies-table',
  descriptor: {
    title: 'Companies',
    endpoint: '/api/Companies',
    columns: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'city', label: 'City', type: 'text' }
    ],
    actions: { create: true, edit: true, delete: true },
    keyField: 'id'
  }
};

const companyForm = {
  type: 'form',
  id: 'company-form',
  descriptor: {
    title: 'Company',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'city', label: 'City', type: 'text' }
    ]
  }
};

function CompaniesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleAction = (actionType, data) => {
    if (actionType === 'create') {
      setEditData(null);
      setShowModal(true);
    } else if (actionType === 'edit') {
      setEditData(data);
      setShowModal(true);
    } else if (actionType === 'delete') {
      // Handle delete
    }
  };

  return (
    <div>
      <DynamicRenderer
        components={[companiesTable]}
        onAction={handleAction}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <DynamicForm
          descriptor={companyForm.descriptor}
          defaultValues={editData}
          onSubmit={(data) => {
            console.log('Save:', data);
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
```

## AI Integration

The descriptor-based approach enables AI systems to:

1. **Generate UIs from prompts**: Convert natural language to JSON descriptors
2. **Modify existing interfaces**: Update descriptors based on user feedback
3. **Create custom views**: Generate specialized views for different use cases

### Example AI Prompt

```
"Create a table showing all employees with columns for name, email,
department, and hire date. Include actions to edit and delete."
```

AI can generate:

```json
{
  "type": "table",
  "descriptor": {
    "endpoint": "/api/Employees",
    "columns": [
      { "key": "firstName", "label": "Name" },
      { "key": "email", "label": "Email" },
      { "key": "department", "label": "Department" },
      { "key": "hireDate", "label": "Hire Date", "type": "date" }
    ],
    "actions": { "edit": true, "delete": true }
  }
}
```

## Best Practices

1. **Keep descriptors in separate files**: Store in `utils/descriptors/`
2. **Validate endpoint responses**: Ensure API matches descriptor schema
3. **Use TypeScript types**: Import types from `types/api.d.ts`
4. **Handle errors gracefully**: Wrap in error boundaries
5. **Test with sample data**: Use mock data during development

## Extending the System

### Adding New Field Types

Edit `src/components/dynamic/DynamicForm.tsx`:

```typescript
case 'phone':
  return (
    <input
      type="tel"
      {...register(field.name)}
      className={baseInputClasses}
    />
  );
```

### Custom Renderers

Create new renderers for charts, cards, etc.:

```typescript
case 'chart':
  return <DynamicChart descriptor={component.descriptor} />;
```

### API Integration

The system automatically:
- Fetches data from specified endpoints
- Handles loading states
- Manages errors
- Supports React Query caching

## Sample Descriptors

See `src/utils/sampleDescriptors.ts` for complete working examples including:
- Companies table with all CRUD operations
- Company creation form with validation
- Custom field formatters
- Action handlers

## Performance Considerations

- Descriptors are loaded once and cached
- React Query caches API responses
- Form validation happens client-side
- Table virtualization recommended for large datasets

## Security

- All API calls respect authentication tokens
- Form validation prevents invalid data
- Descriptors should be validated before rendering
- User permissions should be checked server-side
