import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type CreateEducationalContentInput } from '../schema';
import { getEducationalContentById } from '../handlers/get_educational_content_by_id';

// Test educational content data
const testContent1: CreateEducationalContentInput = {
  title: 'Hindu Temple Architecture',
  category: 'architecture',
  content: 'Hindu temple architecture has evolved over thousands of years, characterized by intricate carvings, towering spires, and sacred geometry that reflects cosmic principles.'
};

const testContent2: CreateEducationalContentInput = {
  title: 'Diwali Festival Traditions',
  category: 'festivals',
  content: 'Diwali, the festival of lights, celebrates the victory of light over darkness. Families light oil lamps, create rangoli patterns, and share sweets to welcome prosperity.'
};

describe('getEducationalContentById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return educational content when found', async () => {
    // Create test educational content
    const insertResult = await db.insert(educationalContentTable)
      .values({
        title: testContent1.title,
        category: testContent1.category,
        content: testContent1.content
      })
      .returning()
      .execute();

    const createdContent = insertResult[0];
    const result = await getEducationalContentById(createdContent.id);

    // Verify content is returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdContent.id);
    expect(result!.title).toBe('Hindu Temple Architecture');
    expect(result!.category).toBe('architecture');
    expect(result!.content).toBe(testContent1.content);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when content not found', async () => {
    const result = await getEducationalContentById(99999);
    expect(result).toBeNull();
  });

  it('should return correct content by specific ID when multiple exist', async () => {
    // Create multiple educational content items
    const insertResult1 = await db.insert(educationalContentTable)
      .values({
        title: testContent1.title,
        category: testContent1.category,
        content: testContent1.content
      })
      .returning()
      .execute();

    const insertResult2 = await db.insert(educationalContentTable)
      .values({
        title: testContent2.title,
        category: testContent2.category,
        content: testContent2.content
      })
      .returning()
      .execute();

    const content1Id = insertResult1[0].id;
    const content2Id = insertResult2[0].id;

    // Get first content
    const result1 = await getEducationalContentById(content1Id);
    expect(result1).not.toBeNull();
    expect(result1!.id).toBe(content1Id);
    expect(result1!.title).toBe('Hindu Temple Architecture');
    expect(result1!.category).toBe('architecture');

    // Get second content
    const result2 = await getEducationalContentById(content2Id);
    expect(result2).not.toBeNull();
    expect(result2!.id).toBe(content2Id);
    expect(result2!.title).toBe('Diwali Festival Traditions');
    expect(result2!.category).toBe('festivals');

    // Ensure they are different
    expect(result1!.id).not.toBe(result2!.id);
    expect(result1!.title).not.toBe(result2!.title);
  });

  it('should handle negative ID values correctly', async () => {
    const result = await getEducationalContentById(-1);
    expect(result).toBeNull();
  });

  it('should handle zero ID correctly', async () => {
    const result = await getEducationalContentById(0);
    expect(result).toBeNull();
  });

  it('should verify created_at and updated_at are proper Date objects', async () => {
    // Create test educational content
    const insertResult = await db.insert(educationalContentTable)
      .values({
        title: 'Philosophy Test Content',
        category: 'philosophy',
        content: 'Test content about Hindu philosophy and its various schools of thought.'
      })
      .returning()
      .execute();

    const createdContent = insertResult[0];
    const result = await getEducationalContentById(createdContent.id);

    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are reasonable (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    expect(result!.created_at.getTime()).toBeGreaterThan(oneMinuteAgo.getTime());
    expect(result!.updated_at.getTime()).toBeGreaterThan(oneMinuteAgo.getTime());
    expect(result!.created_at.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(result!.updated_at.getTime()).toBeLessThanOrEqual(now.getTime());
  });
});