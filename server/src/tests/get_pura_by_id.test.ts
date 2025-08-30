import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { purasTable, donationsTable } from '../db/schema';
import { type CreatePuraInput, type CreateDonationInput } from '../schema';
import { getPuraById } from '../handlers/get_pura_by_id';

// Test data
const testPura: CreatePuraInput = {
  name: 'Test Temple',
  location: 'Test City',
  description: 'A beautiful temple for testing',
  target_amount: 50000
};

const testDonation1: Omit<CreateDonationInput, 'pura_id'> = {
  donor_name: 'John Doe',
  amount: 1000,
  message: 'For the community'
};

const testDonation2: Omit<CreateDonationInput, 'pura_id'> = {
  donor_name: 'Jane Smith',
  amount: 2500,
  message: null
};

describe('getPuraById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return pura with donations when pura exists', async () => {
    // Create test pura
    const puraResult = await db.insert(purasTable)
      .values({
        name: testPura.name,
        location: testPura.location,
        description: testPura.description,
        target_amount: testPura.target_amount.toString(),
        current_amount: '3500' // Sum of donations
      })
      .returning()
      .execute();

    const puraId = puraResult[0].id;

    // Create test donations
    await db.insert(donationsTable)
      .values([
        {
          pura_id: puraId,
          donor_name: testDonation1.donor_name,
          amount: testDonation1.amount.toString(),
          message: testDonation1.message
        },
        {
          pura_id: puraId,
          donor_name: testDonation2.donor_name,
          amount: testDonation2.amount.toString(),
          message: testDonation2.message
        }
      ])
      .execute();

    // Test the handler
    const result = await getPuraById(puraId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(puraId);
    expect(result!.name).toEqual('Test Temple');
    expect(result!.location).toEqual('Test City');
    expect(result!.description).toEqual('A beautiful temple for testing');
    expect(result!.target_amount).toEqual(50000);
    expect(result!.current_amount).toEqual(3500);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify donations array
    expect(result!.donations).toHaveLength(2);
    
    // Check first donation
    const donation1 = result!.donations.find(d => d.donor_name === 'John Doe');
    expect(donation1).toBeDefined();
    expect(donation1!.amount).toEqual(1000);
    expect(donation1!.message).toEqual('For the community');
    expect(donation1!.created_at).toBeInstanceOf(Date);

    // Check second donation
    const donation2 = result!.donations.find(d => d.donor_name === 'Jane Smith');
    expect(donation2).toBeDefined();
    expect(donation2!.amount).toEqual(2500);
    expect(donation2!.message).toBeNull();
    expect(donation2!.created_at).toBeInstanceOf(Date);
  });

  it('should return pura with empty donations array when no donations exist', async () => {
    // Create test pura without donations
    const puraResult = await db.insert(purasTable)
      .values({
        name: testPura.name,
        location: testPura.location,
        description: testPura.description,
        target_amount: testPura.target_amount.toString()
      })
      .returning()
      .execute();

    const puraId = puraResult[0].id;

    // Test the handler
    const result = await getPuraById(puraId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(puraId);
    expect(result!.name).toEqual('Test Temple');
    expect(result!.donations).toHaveLength(0);
    expect(result!.donations).toEqual([]);
  });

  it('should return null when pura does not exist', async () => {
    const result = await getPuraById(999);
    expect(result).toBeNull();
  });

  it('should handle numeric conversions correctly', async () => {
    // Create pura with decimal values
    const puraResult = await db.insert(purasTable)
      .values({
        name: 'Decimal Test Temple',
        location: 'Test City',
        description: 'Testing decimal handling',
        target_amount: '75000.50',
        current_amount: '12345.75'
      })
      .returning()
      .execute();

    const puraId = puraResult[0].id;

    // Create donation with decimal amount
    await db.insert(donationsTable)
      .values({
        pura_id: puraId,
        donor_name: 'Decimal Donor',
        amount: '999.99',
        message: 'Testing decimals'
      })
      .execute();

    const result = await getPuraById(puraId);

    expect(result).not.toBeNull();
    expect(typeof result!.target_amount).toBe('number');
    expect(result!.target_amount).toEqual(75000.50);
    expect(typeof result!.current_amount).toBe('number');
    expect(result!.current_amount).toEqual(12345.75);
    
    expect(result!.donations).toHaveLength(1);
    expect(typeof result!.donations[0].amount).toBe('number');
    expect(result!.donations[0].amount).toEqual(999.99);
  });

  it('should handle multiple donations correctly', async () => {
    // Create test pura
    const puraResult = await db.insert(purasTable)
      .values({
        name: 'Multiple Donations Temple',
        location: 'Test City',
        description: 'Testing multiple donations',
        target_amount: '100000.00'
      })
      .returning()
      .execute();

    const puraId = puraResult[0].id;

    // Create multiple donations
    const donationAmounts = [100, 250, 500, 1000, 2500];
    const donationValues = donationAmounts.map((amount, index) => ({
      pura_id: puraId,
      donor_name: `Donor ${index + 1}`,
      amount: amount.toString(),
      message: index % 2 === 0 ? `Message ${index + 1}` : null
    }));

    await db.insert(donationsTable)
      .values(donationValues)
      .execute();

    const result = await getPuraById(puraId);

    expect(result).not.toBeNull();
    expect(result!.donations).toHaveLength(5);
    
    // Verify all donation amounts
    const resultAmounts = result!.donations.map(d => d.amount).sort((a, b) => a - b);
    expect(resultAmounts).toEqual([100, 250, 500, 1000, 2500]);
    
    // Verify message handling (some null, some with values)
    const messagesWithContent = result!.donations.filter(d => d.message !== null);
    const nullMessages = result!.donations.filter(d => d.message === null);
    expect(messagesWithContent.length + nullMessages.length).toEqual(5);
  });
});