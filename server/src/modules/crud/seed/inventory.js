export const productEntity = {
  name: 'Product',
  slug: 'product',
  description: 'Manage inventory items and store stock status',
  fields: [
    { name: 'Name', columnName: 'name', fieldType: 'text', required: true, unique: false },
    { name: 'Price', columnName: 'price', fieldType: 'number', required: true, unique: false },
    {
      name: 'Category',
      columnName: 'category',
      fieldType: 'select',
      required: true,
      options: [
        { label: 'Electronics', value: 'electronics' },
        { label: 'Clothing', value: 'clothing' },
        { label: 'Furniture', value: 'furniture' },
        { label: 'Office Supplies', value: 'office_supplies' }
      ]
    },
    {
      name: 'Status',
      columnName: 'status',
      fieldType: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Out of Stock', value: 'out_of_stock' }
      ]
    },
    { name: 'In Stock', columnName: 'instock', fieldType: 'boolean', required: false, defaultValue: 'true' },
    { name: 'Description', columnName: 'description', fieldType: 'textarea', required: false }
  ]
};

export const productData = [
  { name: 'MacBook Pro 16', price: 2499, category: 'electronics', status: 'active', instock: true, description: 'Apple M3 Pro chip with 18GB unified memory' },
  { name: 'Ergonomic Desk Chair', price: 349, category: 'furniture', status: 'active', instock: true, description: 'Mesh office chair with lumbar support' },
  { name: 'Wireless Noise Cancelling Headphones', price: 299, category: 'electronics', status: 'active', instock: true, description: 'Over-ear headphones with 30-hour battery life' },
  { name: 'Cotton Crewneck T-Shirt', price: 25, category: 'clothing', status: 'active', instock: true, description: '100% organic cotton basic tee' },
  { name: 'Leather Sofa', price: 1200, category: 'furniture', status: 'out_of_stock', instock: false, description: 'Top-grain Italian leather 3-seater sofa' }
];
