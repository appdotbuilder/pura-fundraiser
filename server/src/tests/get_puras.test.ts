import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { purasTable, donationsTable } from '../db/schema';
import { getPuras } from '../handlers/get_puras';

describe('getPuras', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no puras exist', async () => {
    const result = await getPuras();
    expect(result).toEqual([]);
  });

  it('should return puras with zero current_amount when no donations exist', async () => {
    // Create test pura without donations
    await db.insert(purasTable).values({
      name: 'Test Temple',
      location: 'Test City',
      description: 'A temple for testing',
      target_amount: '50000.00'
    }).execute();

    const result = await getPuras();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Temple');
    expect(result[0].location).toEqual('Test City');
    expect(result[0].description).toEqual('A temple for testing');
    expect(result[0].target_amount).toEqual(50000);
    expect(result[0].current_amount).toEqual(0);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should calculate current_amount correctly based on donations', async () => {
    // Create test pura
    const puraResult = await db.insert(purasTable).values({
      name: 'Donation Temple',
      location: 'Donation City',
      description: 'A temple with donations',
      target_amount: '100000.00'
    }).returning().execute();

    const puraId = puraResult[0].id;

    // Create multiple donations
    await db.insert(donationsTable).values([
      {
        pura_id: puraId,
        donor_name: 'John Doe',
        amount: '1000.50',
        message: 'First donation'
      },
      {
        pura_id: puraId,
        donor_name: 'Jane Smith',
        amount: '2500.25',
        message: 'Second donation'
      },
      {
        pura_id: puraId,
        donor_name: 'Anonymous',
        amount: '500.00',
        message: null
      }
    ]).execute();

    const result = await getPuras();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Donation Temple');
    expect(result[0].target_amount).toEqual(100000);
    expect(result[0].current_amount).toEqual(4000.75); // Sum of all donations
    expect(typeof result[0].target_amount).toBe('number');
    expect(typeof result[0].current_amount).toBe('number');
  });

  it('should return multiple puras with correct donation totals', async () => {
    // Create multiple puras
    const puraResults = await db.insert(purasTable).values([
      {
        name: 'Temple A',
        location: 'City A',
        description: 'First temple',
        target_amount: '50000.00'
      },
      {
        name: 'Temple B',
        location: 'City B',
        description: 'Second temple',
        target_amount: '75000.00'
      },
      {
        name: 'Temple C',
        location: 'City C',
        description: 'Third temple',
        target_amount: '100000.00'
      }
    ]).returning().execute();

    // Add donations to first two temples
    await db.insert(donationsTable).values([
      // Temple A donations
      {
        pura_id: puraResults[0].id,
        donor_name: 'Donor 1',
        amount: '1000.00'
      },
      {
        pura_id: puraResults[0].id,
        donor_name: 'Donor 2',
        amount: '1500.50'
      },
      // Temple B donations
      {
        pura_id: puraResults[1].id,
        donor_name: 'Donor 3',
        amount: '3000.25'
      }
      // Temple C has no donations
    ]).execute();

    const result = await getPuras();

    expect(result).toHaveLength(3);

    // Sort results by name for consistent testing
    const sortedResult = result.sort((a, b) => a.name.localeCompare(b.name));

    // Temple A
    expect(sortedResult[0].name).toEqual('Temple A');
    expect(sortedResult[0].current_amount).toEqual(2500.50);
    expect(sortedResult[0].target_amount).toEqual(50000);

    // Temple B
    expect(sortedResult[1].name).toEqual('Temple B');
    expect(sortedResult[1].current_amount).toEqual(3000.25);
    expect(sortedResult[1].target_amount).toEqual(75000);

    // Temple C (no donations)
    expect(sortedResult[2].name).toEqual('Temple C');
    expect(sortedResult[2].current_amount).toEqual(0);
    expect(sortedResult[2].target_amount).toEqual(100000);
  });

  it('should handle decimal amounts correctly', async () => {
    // Create pura
    const puraResult = await db.insert(purasTable).values({
      name: 'Decimal Temple',
      location: 'Decimal City',
      description: 'Testing decimal calculations',
      target_amount: '10000.99'
    }).returning().execute();

    // Add donations with various decimal places
    await db.insert(donationsTable).values([
      {
        pura_id: puraResult[0].id,
        donor_name: 'Decimal Donor 1',
        amount: '123.45'
      },
      {
        pura_id: puraResult[0].id,
        donor_name: 'Decimal Donor 2',
        amount: '67.89'
      },
      {
        pura_id: puraResult[0].id,
        donor_name: 'Decimal Donor 3',
        amount: '0.01'
      }
    ]).execute();

    const result = await getPuras();

    expect(result).toHaveLength(1);
    expect(result[0].target_amount).toEqual(10000.99);
    expect(result[0].current_amount).toEqual(191.35); // 123.45 + 67.89 + 0.01
    expect(typeof result[0].target_amount).toBe('number');
    expect(typeof result[0].current_amount).toBe('number');
  });

  it('should return all puras with correct data integrity', async () => {
    // Create multiple puras with different data
    const expectedPuras = [
      {
        name: 'Zebra Temple',
        location: 'Zoo City',
        description: 'Animal themed temple',
        target_amount: '45000.00'
      },
      {
        name: 'Alpha Temple',
        location: 'First City',
        description: 'The first temple',
        target_amount: '60000.00'
      },
      {
        name: 'Beta Temple',
        location: 'Second City',
        description: 'The second temple',
        target_amount: '75000.00'
      }
    ];
    
    for (const pura of expectedPuras) {
      await db.insert(purasTable).values(pura).execute();
    }

    const result = await getPuras();

    expect(result).toHaveLength(3);
    
    // Sort both arrays by name for consistent comparison
    const sortedResult = result.sort((a, b) => a.name.localeCompare(b.name));
    const sortedExpected = expectedPuras.sort((a, b) => a.name.localeCompare(b.name));

    // Verify each pura contains correct data
    for (let i = 0; i < sortedResult.length; i++) {
      expect(sortedResult[i].name).toEqual(sortedExpected[i].name);
      expect(sortedResult[i].location).toEqual(sortedExpected[i].location);
      expect(sortedResult[i].description).toEqual(sortedExpected[i].description);
      expect(sortedResult[i].target_amount).toEqual(parseFloat(sortedExpected[i].target_amount));
      expect(sortedResult[i].current_amount).toEqual(0); // No donations
      expect(sortedResult[i].id).toBeDefined();
      expect(sortedResult[i].created_at).toBeInstanceOf(Date);
      expect(sortedResult[i].updated_at).toBeInstanceOf(Date);
    }
  });
});