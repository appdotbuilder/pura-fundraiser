import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { purasTable, donationsTable } from '../db/schema';
import { getDonationsByPura } from '../handlers/get_donations_by_pura';

describe('getDonationsByPura', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return donations for a specific pura ordered by creation date (most recent first)', async () => {
    // Create test pura
    const puraResult = await db.insert(purasTable)
      .values({
        name: 'Test Temple',
        location: 'Test Location',
        description: 'A temple for testing',
        target_amount: '10000.00'
      })
      .returning()
      .execute();

    const puraId = puraResult[0].id;

    // Create multiple donations with slight time differences
    const donation1 = await db.insert(donationsTable)
      .values({
        pura_id: puraId,
        donor_name: 'John Doe',
        amount: '100.00',
        message: 'First donation'
      })
      .returning()
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const donation2 = await db.insert(donationsTable)
      .values({
        pura_id: puraId,
        donor_name: 'Jane Smith',
        amount: '250.50',
        message: 'Second donation'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const donation3 = await db.insert(donationsTable)
      .values({
        pura_id: puraId,
        donor_name: 'Bob Wilson',
        amount: '75.25',
        message: null
      })
      .returning()
      .execute();

    const result = await getDonationsByPura(puraId);

    // Should return all 3 donations
    expect(result).toHaveLength(3);

    // Verify ordering (most recent first)
    expect(result[0].donor_name).toEqual('Bob Wilson');
    expect(result[1].donor_name).toEqual('Jane Smith');
    expect(result[2].donor_name).toEqual('John Doe');

    // Verify amounts are converted to numbers
    expect(typeof result[0].amount).toBe('number');
    expect(typeof result[1].amount).toBe('number');
    expect(typeof result[2].amount).toBe('number');

    // Verify specific values
    expect(result[0].amount).toEqual(75.25);
    expect(result[1].amount).toEqual(250.50);
    expect(result[2].amount).toEqual(100.00);

    // Verify all donations belong to the correct pura
    result.forEach(donation => {
      expect(donation.pura_id).toEqual(puraId);
    });

    // Verify nullable message field handling
    expect(result[0].message).toBeNull();
    expect(result[1].message).toEqual('Second donation');
    expect(result[2].message).toEqual('First donation');
  });

  it('should return empty array when pura has no donations', async () => {
    // Create test pura without donations
    const puraResult = await db.insert(purasTable)
      .values({
        name: 'Empty Temple',
        location: 'Test Location',
        description: 'A temple with no donations',
        target_amount: '5000.00'
      })
      .returning()
      .execute();

    const puraId = puraResult[0].id;
    const result = await getDonationsByPura(puraId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent pura', async () => {
    const nonExistentPuraId = 99999;
    const result = await getDonationsByPura(nonExistentPuraId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return donations for the specified pura', async () => {
    // Create two test puras
    const pura1Result = await db.insert(purasTable)
      .values({
        name: 'Temple 1',
        location: 'Location 1',
        description: 'First temple',
        target_amount: '5000.00'
      })
      .returning()
      .execute();

    const pura2Result = await db.insert(purasTable)
      .values({
        name: 'Temple 2',
        location: 'Location 2',
        description: 'Second temple',
        target_amount: '8000.00'
      })
      .returning()
      .execute();

    const pura1Id = pura1Result[0].id;
    const pura2Id = pura2Result[0].id;

    // Create donations for both puras
    await db.insert(donationsTable)
      .values([
        {
          pura_id: pura1Id,
          donor_name: 'Donor A',
          amount: '100.00',
          message: 'For temple 1'
        },
        {
          pura_id: pura1Id,
          donor_name: 'Donor B',
          amount: '200.00',
          message: 'Also for temple 1'
        },
        {
          pura_id: pura2Id,
          donor_name: 'Donor C',
          amount: '300.00',
          message: 'For temple 2'
        }
      ])
      .execute();

    // Get donations for pura 1
    const pura1Donations = await getDonationsByPura(pura1Id);

    // Should only return donations for pura 1
    expect(pura1Donations).toHaveLength(2);
    pura1Donations.forEach(donation => {
      expect(donation.pura_id).toEqual(pura1Id);
    });

    // Get donations for pura 2
    const pura2Donations = await getDonationsByPura(pura2Id);

    // Should only return donations for pura 2
    expect(pura2Donations).toHaveLength(1);
    expect(pura2Donations[0].pura_id).toEqual(pura2Id);
    expect(pura2Donations[0].donor_name).toEqual('Donor C');
  });

  it('should handle large amounts correctly', async () => {
    // Create test pura
    const puraResult = await db.insert(purasTable)
      .values({
        name: 'Big Temple',
        location: 'Test Location',
        description: 'A temple for large donations',
        target_amount: '100000.00'
      })
      .returning()
      .execute();

    const puraId = puraResult[0].id;

    // Create donation with large amount
    await db.insert(donationsTable)
      .values({
        pura_id: puraId,
        donor_name: 'Generous Donor',
        amount: '99999.99',
        message: 'Large donation'
      })
      .execute();

    const result = await getDonationsByPura(puraId);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toEqual(99999.99);
    expect(typeof result[0].amount).toBe('number');
  });
});