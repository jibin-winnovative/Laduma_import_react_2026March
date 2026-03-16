import { ComponentDescriptor } from '../components/dynamic/DynamicRenderer';

export const companiesTableDescriptor: ComponentDescriptor = {
  type: 'table',
  id: 'companies-table',
  title: 'Companies',
  descriptor: {
    title: 'Companies',
    endpoint: '/api/Companies',
    columns: [
      { key: 'name', label: 'Company Name', type: 'text' },
      { key: 'registrationNumber', label: 'Registration #', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phoneNumber', label: 'Phone', type: 'text' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'country', label: 'Country', type: 'text' },
      {
        key: 'isActive',
        label: 'Status',
        type: 'boolean',
        format: (value: unknown) => (value ? 'Active' : 'Inactive'),
      },
    ],
    actions: {
      create: true,
      edit: true,
      delete: true,
      view: true,
    },
    keyField: 'id',
  },
};

export const createCompanyFormDescriptor: ComponentDescriptor = {
  type: 'form',
  id: 'create-company-form',
  title: 'Create Company',
  descriptor: {
    title: 'Create New Company',
    submitLabel: 'Create Company',
    cancelLabel: 'Cancel',
    fields: [
      {
        name: 'name',
        label: 'Company Name',
        type: 'text',
        required: true,
        placeholder: 'Enter company name',
      },
      {
        name: 'registrationNumber',
        label: 'Registration Number',
        type: 'text',
        placeholder: 'Enter registration number',
      },
      {
        name: 'vatNumber',
        label: 'VAT Number',
        type: 'text',
        placeholder: 'Enter VAT number',
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'company@example.com',
      },
      {
        name: 'phoneNumber',
        label: 'Phone Number',
        type: 'text',
        placeholder: '+27 XX XXX XXXX',
      },
      {
        name: 'address',
        label: 'Address',
        type: 'textarea',
        placeholder: 'Enter full address',
      },
      {
        name: 'city',
        label: 'City',
        type: 'text',
        placeholder: 'Enter city',
      },
      {
        name: 'country',
        label: 'Country',
        type: 'text',
        placeholder: 'Enter country',
      },
      {
        name: 'postalCode',
        label: 'Postal Code',
        type: 'text',
        placeholder: 'Enter postal code',
      },
      {
        name: 'contactPerson',
        label: 'Contact Person',
        type: 'text',
        placeholder: 'Enter contact person name',
      },
      {
        name: 'isActive',
        label: 'Active',
        type: 'checkbox',
      },
    ],
  },
};
