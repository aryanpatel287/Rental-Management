import { productEntity, productData } from './inventory.js';
import { leadEntity, leadData } from './crm.js';
import * as definitionService from '../services/definition.service.js';
import * as crudService from '../services/crud.service.js';

export async function seedCrud() {
  console.log('Seeding CRUD entity definitions and records...');

  // 1. Clean up existing definitions
  try {
    await definitionService.deleteEntity('product');
    console.log('Cleaned up existing "product" definition');
  } catch (err) {
    // Ignore if not exists
  }

  try {
    await definitionService.deleteEntity('lead');
    console.log('Cleaned up existing "lead" definition');
  } catch (err) {
    // Ignore if not exists
  }

  // 2. Create product entity definition and seed records
  console.log('Creating Product entity definition...');
  const newProductEntity = await definitionService.createEntity(productEntity);
  
  console.log('Seeding Product records...');
  for (const item of productData) {
    await crudService.createOne('product', item, newProductEntity.fields);
  }
  console.log(`Successfully seeded ${productData.length} products.`);

  // 3. Create lead entity definition and seed records
  console.log('Creating Lead entity definition...');
  const newLeadEntity = await definitionService.createEntity(leadEntity);

  console.log('Seeding Lead records...');
  for (const item of leadData) {
    await crudService.createOne('lead', item, newLeadEntity.fields);
  }
  console.log(`Successfully seeded ${leadData.length} leads.`);
}
export default seedCrud;
