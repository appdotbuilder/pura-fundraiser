import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { purasTable } from '../db/schema';
import { type CreatePuraInput } from '../schema';
import { createPura } from '../handlers/create_pura';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreatePuraInput = {
  name: 'Test Pura',
  location: 'Kathmandu, Nepal',
  description: 'A beautiful traditional pura for community gatherings and ceremonies',
  target_amount: 50000.50
};

describe('createPura', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a pura with all required fields', async () => {
    const result = await createPura(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Pura');
    expect(result.location).toEqual('Kathmandu, Nepal');
    expect(result.description).toEqual(testInput.description);
    expect(result.target_amount).toEqual(50000.50);
    expect(result.current_amount).toEqual(0); // Should always initialize to 0
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save pura to database correctly', async () => {
    const result = await createPura(testInput);

    // Query database to verify data was saved
    const puras = await db.select()
      .from(purasTable)
      .where(eq(purasTable.id, result.id))
      .execute();

    expect(puras).toHaveLength(1);
    const savedPura = puras[0];
    
    expect(savedPura.name).toEqual('Test Pura');
    expect(savedPura.location).toEqual('Kathmandu, Nepal');
    expect(savedPura.description).toEqual(testInput.description);
    expect(parseFloat(savedPura.target_amount)).toEqual(50000.50);
    expect(parseFloat(savedPura.current_amount)).toEqual(0);
    expect(savedPura.created_at).toBeInstanceOf(Date);
    expect(savedPura.updated_at).toBeInstanceOf(Date);
  });

  it('should handle numeric conversions correctly', async () => {
    const decimalInput: CreatePuraInput = {
      name: 'Decimal Test Pura',
      location: 'Pokhara, Nepal', 
      description: 'Testing decimal handling',
      target_amount: 12345.67
    };

    const result = await createPura(decimalInput);

    // Verify numeric types in response
    expect(typeof result.target_amount).toBe('number');
    expect(typeof result.current_amount).toBe('number');
    expect(result.target_amount).toEqual(12345.67);
    expect(result.current_amount).toEqual(0);

    // Verify database storage and retrieval
    const saved = await db.select()
      .from(purasTable)
      .where(eq(purasTable.id, result.id))
      .execute();

    expect(parseFloat(saved[0].target_amount)).toEqual(12345.67);
    expect(parseFloat(saved[0].current_amount)).toEqual(0);
  });

  it('should always initialize current_amount to 0', async () => {
    const result = await createPura(testInput);

    expect(result.current_amount).toEqual(0);

    // Verify in database
    const saved = await db.select()
      .from(purasTable)
      .where(eq(purasTable.id, result.id))
      .execute();

    expect(parseFloat(saved[0].current_amount)).toEqual(0);
  });

  it('should set created_at and updated_at timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createPura(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within expected range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // Verify both timestamps are set to the same time initially
    expect(Math.abs(result.created_at.getTime() - result.updated_at.getTime())).toBeLessThan(1000);
  });

  it('should create multiple puras independently', async () => {
    const input1: CreatePuraInput = {
      name: 'First Pura',
      location: 'Lalitpur, Nepal',
      description: 'First test pura',
      target_amount: 25000
    };

    const input2: CreatePuraInput = {
      name: 'Second Pura', 
      location: 'Bhaktapur, Nepal',
      description: 'Second test pura',
      target_amount: 35000
    };

    const result1 = await createPura(input1);
    const result2 = await createPura(input2);

    // Verify different IDs
    expect(result1.id).not.toEqual(result2.id);
    
    // Verify distinct data
    expect(result1.name).toEqual('First Pura');
    expect(result2.name).toEqual('Second Pura');
    expect(result1.target_amount).toEqual(25000);
    expect(result2.target_amount).toEqual(35000);

    // Verify both are saved in database
    const allPuras = await db.select().from(purasTable).execute();
    expect(allPuras).toHaveLength(2);
  });
});