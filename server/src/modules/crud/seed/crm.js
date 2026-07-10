export const leadEntity = {
  name: 'Lead',
  slug: 'lead',
  description: 'Manage sales leads and contact funnels',
  fields: [
    { name: 'Name', columnName: 'name', fieldType: 'text', required: true },
    { name: 'Email', columnName: 'email', fieldType: 'email', required: true },
    { name: 'Phone', columnName: 'phone', fieldType: 'text', required: false },
    {
      name: 'Source',
      columnName: 'source',
      fieldType: 'select',
      required: true,
      options: [
        { label: 'Website', value: 'website' },
        { label: 'Referral', value: 'referral' },
        { label: 'Cold Call', value: 'cold_call' },
        { label: 'Social Media', value: 'social_media' }
      ]
    },
    {
      name: 'Status',
      columnName: 'status',
      fieldType: 'select',
      required: true,
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Lost', value: 'lost' }
      ]
    },
    { name: 'Notes', columnName: 'notes', fieldType: 'textarea', required: false }
  ]
};

export const leadData = [
  { name: 'John Doe', email: 'john.doe@example.com', phone: '+123456789', source: 'website', status: 'new', notes: 'Interested in buying MacBook Pro fleet' },
  { name: 'Sarah Connor', email: 'sarah.c@sky.net', phone: '+987654321', source: 'referral', status: 'contacted', notes: 'Requested demo for team office chairs' },
  { name: 'Bruce Wayne', email: 'bruce@waynecorp.com', phone: '+111222333', source: 'social_media', status: 'qualified', notes: 'High value target, looking for custom furniture contracts' }
];
