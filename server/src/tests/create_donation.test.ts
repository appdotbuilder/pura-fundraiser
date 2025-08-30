import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { purasTable, donationsTable } from '../db/schema';
import { type CreateDonationInput } from '../schema';
import { createDonation } from '../handlers/create_donation';
import { eq } from 'drizzle-orm';

// Test pura data
const testPura = {
  name: 'Test Temple',
  location: 'Test City',
  description: 'A temple for testing',
  target_amount: '10000.00'
};

// Test donation input
const testDonationInput: CreateDonationInput = {
  pura_id: 1,
  donor_name: 'John Doe',
  amount: 500.50,
  message: 'For the temple renovation'
};

describe('createDonation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a donation successfully', async () => {
    // Create prerequisite pura
    await db.insert(purasTable).values(testPura).execute();

    const result = await createDonation(testDonationInput);

    // Verify donation fields
    expect(result.pura_id).toEqual(1);
    expect(result.donor_name).toEqual('John Doe');
    expect(result.amount).toEqual(500.50);
    expect(typeof result.amount).toBe('number');
    expect(result.message).toEqual('For the temple renovation');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save donation to database', async () => {
    // Create prerequisite pura
    await db.insert(purasTable).values(testPura).execute();

    const result = await createDonation(testDonationInput);

    // Verify donation is saved in database
    const donations = await db.select()
      .from(donationsTable)
      .where(eq(donationsTable.id, result.id))
      .execute();

    expect(donations).toHaveLength(1);
    expect(donations[0].pura_id).toEqual(1);
    expect(donations[0].donor_name).toEqual('John Doe');
    expect(parseFloat(donations[0].amount)).toEqual(500.50);
    expect(donations[0].message).toEqual('For the temple renovation');
    expect(donations[0].created_at).toBeInstanceOf(Date);
  });

  it('should update pura current_amount correctly', async () => {
    // Create pura with initial current_amount of 1000
    const puraWithAmount = {
      ...testPura,
      current_amount: '1000.00'
    };
    await db.insert(purasTable).values(puraWithAmount).execute();

    await createDonation(testDonationInput);

    // Verify pura's current_amount is updated
    const puras = await db.select()
      .from(purasTable)
      .where(eq(purasTable.id, 1))
      .execute();

    expect(puras).toHaveLength(1);
    expect(parseFloat(puras[0].current_amount)).toEqual(1500.50); // 1000 + 500.50
    expect(puras[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle donations with null message', async () => {
    // Create prerequisite pura
    await db.insert(purasTable).values(testPura).execute();

    const inputWithoutMessage: CreateDonationInput = {
      pura_id: 1,
      donor_name: 'Jane Smith',
      amount: 250.00
      // message is optional and not provided
    };

    const result = await createDonation(inputWithoutMessage);

    expect(result.donor_name).toEqual('Jane Smith');
    expect(result.amount).toEqual(250.00);
    expect(result.message).toBeNull();

    // Verify in database
    const donations = await db.select()
      .from(donationsTable)
      .where(eq(donationsTable.id, result.id))
      .execute();

    expect(donations[0].message).toBeNull();
  });

  it('should handle multiple donations to same pura', async () => {
    // Create prerequisite pura
    await db.insert(purasTable).values(testPura).execute();

    // First donation
    const firstDonation = await createDonation(testDonationInput);
    
    // Second donation
    const secondDonationInput: CreateDonationInput = {
      pura_id: 1,
      donor_name: 'Jane Smith',
      amount: 300.25,
      message: 'Second donation'
    };
    const secondDonation = await createDonation(secondDonationInput);

    // Verify both donations exist
    expect(firstDonation.id).not.toEqual(secondDonation.id);
    expect(firstDonation.amount).toEqual(500.50);
    expect(secondDonation.amount).toEqual(300.25);

    // Verify pura's current_amount reflects both donations
    const puras = await db.select()
      .from(purasTable)
      .where(eq(purasTable.id, 1))
      .execute();

    expect(parseFloat(puras[0].current_amount)).toEqual(800.75); // 500.50 + 300.25
  });

  it('should throw error when pura does not exist', async () => {
    // Don't create any pura, so pura_id 999 won't exist
    const invalidInput: CreateDonationInput = {
      pura_id: 999,
      donor_name: 'John Doe',
      amount: 100.00,
      message: 'This should fail'
    };

    await expect(createDonation(invalidInput)).rejects.toThrow(/pura.*not found/i);
  });

  it('should handle decimal amounts correctly', async () => {
    // Create prerequisite pura
    await db.insert(purasTable).values(testPura).execute();

    const decimalInput: CreateDonationInput = {
      pura_id: 1,
      donor_name: 'Decimal Donor',
      amount: 123.45,
      message: 'Testing decimal amounts'
    };

    const result = await createDonation(decimalInput);

    expect(result.amount).toEqual(123.45);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const donations = await db.select()
      .from(donationsTable)
      .where(eq(donationsTable.id, result.id))
      .execute();

    expect(parseFloat(donations[0].amount)).toEqual(123.45);

    // Verify pura current_amount update
    const puras = await db.select()
      .from(purasTable)
      .where(eq(purasTable.id, 1))
      .execute();

    expect(parseFloat(puras[0].current_amount)).toEqual(123.45);
  });
});