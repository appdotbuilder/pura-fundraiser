import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { purasTable } from '../db/schema';
import { type UpdatePuraInput, type CreatePuraInput } from '../schema';
import { updatePura } from '../handlers/update_pura';
import { eq } from 'drizzle-orm';

// Test input for creating a pura
const testCreateInput: CreatePuraInput = {
  name: 'Original Temple',
  location: 'Original Location',
  description: 'Original description',
  target_amount: 50000
};

describe('updatePura', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test pura
  const createTestPura = async () => {
    const result = await db.insert(purasTable)
      .values({
        name: testCreateInput.name,
        location: testCreateInput.location,
        description: testCreateInput.description,
        target_amount: testCreateInput.target_amount.toString()
      })
      .returning()
      .execute();

    return {
      ...result[0],
      target_amount: parseFloat(result[0].target_amount),
      current_amount: parseFloat(result[0].current_amount)
    };
  };

  it('should update all fields when provided', async () => {
    const createdPura = await createTestPura();
    
    const updateInput: UpdatePuraInput = {
      id: createdPura.id,
      name: 'Updated Temple',
      location: 'Updated Location',
      description: 'Updated description',
      target_amount: 75000
    };

    const result = await updatePura(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdPura.id);
    expect(result!.name).toBe('Updated Temple');
    expect(result!.location).toBe('Updated Location');
    expect(result!.description).toBe('Updated description');
    expect(result!.target_amount).toBe(75000);
    expect(result!.current_amount).toBe(0); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > createdPura.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    const createdPura = await createTestPura();
    
    const updateInput: UpdatePuraInput = {
      id: createdPura.id,
      name: 'Only Name Updated'
    };

    const result = await updatePura(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Only Name Updated');
    expect(result!.location).toBe(testCreateInput.location); // Should remain unchanged
    expect(result!.description).toBe(testCreateInput.description); // Should remain unchanged
    expect(result!.target_amount).toBe(testCreateInput.target_amount); // Should remain unchanged
    expect(result!.updated_at > createdPura.updated_at).toBe(true);
  });

  it('should update multiple fields selectively', async () => {
    const createdPura = await createTestPura();
    
    const updateInput: UpdatePuraInput = {
      id: createdPura.id,
      location: 'New Location',
      target_amount: 100000
    };

    const result = await updatePura(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toBe(testCreateInput.name); // Should remain unchanged
    expect(result!.location).toBe('New Location');
    expect(result!.description).toBe(testCreateInput.description); // Should remain unchanged
    expect(result!.target_amount).toBe(100000);
    expect(result!.updated_at > createdPura.updated_at).toBe(true);
  });

  it('should return null when pura does not exist', async () => {
    const nonExistentId = 99999;
    
    const updateInput: UpdatePuraInput = {
      id: nonExistentId,
      name: 'Non-existent Pura'
    };

    const result = await updatePura(updateInput);

    expect(result).toBeNull();
  });

  it('should save updates to database correctly', async () => {
    const createdPura = await createTestPura();
    
    const updateInput: UpdatePuraInput = {
      id: createdPura.id,
      name: 'Database Test Temple',
      description: 'Database test description'
    };

    const result = await updatePura(updateInput);

    // Query database directly to verify changes
    const puras = await db.select()
      .from(purasTable)
      .where(eq(purasTable.id, createdPura.id))
      .execute();

    expect(puras).toHaveLength(1);
    expect(puras[0].name).toBe('Database Test Temple');
    expect(puras[0].description).toBe('Database test description');
    expect(puras[0].location).toBe(testCreateInput.location); // Should remain unchanged
    expect(parseFloat(puras[0].target_amount)).toBe(testCreateInput.target_amount); // Should remain unchanged
    expect(puras[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle numeric field updates correctly', async () => {
    const createdPura = await createTestPura();
    
    const updateInput: UpdatePuraInput = {
      id: createdPura.id,
      target_amount: 123456.78
    };

    const result = await updatePura(updateInput);

    expect(result).not.toBeNull();
    expect(typeof result!.target_amount).toBe('number');
    expect(result!.target_amount).toBe(123456.78);

    // Verify in database
    const puras = await db.select()
      .from(purasTable)
      .where(eq(purasTable.id, createdPura.id))
      .execute();

    expect(parseFloat(puras[0].target_amount)).toBe(123456.78);
  });

  it('should always update the updated_at timestamp', async () => {
    const createdPura = await createTestPura();
    
    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));
    
    const updateInput: UpdatePuraInput = {
      id: createdPura.id,
      name: 'Timestamp Test'
    };

    const result = await updatePura(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > createdPura.updated_at).toBe(true);
  });

  it('should preserve current_amount when updating other fields', async () => {
    const createdPura = await createTestPura();
    
    // Manually update current_amount to test preservation
    await db.update(purasTable)
      .set({ current_amount: '25000.50' })
      .where(eq(purasTable.id, createdPura.id))
      .execute();

    const updateInput: UpdatePuraInput = {
      id: createdPura.id,
      name: 'Preserve Amount Test'
    };

    const result = await updatePura(updateInput);

    expect(result).not.toBeNull();
    expect(result!.current_amount).toBe(25000.50);
    expect(result!.name).toBe('Preserve Amount Test');
  });
});