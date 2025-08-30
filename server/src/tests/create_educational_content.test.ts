import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type CreateEducationalContentInput, type ContentCategory } from '../schema';
import { createEducationalContent } from '../handlers/create_educational_content';
import { eq } from 'drizzle-orm';

// Test inputs for different categories
const historyInput: CreateEducationalContentInput = {
  title: 'Ancient Temple Architecture',
  category: 'history',
  content: 'A detailed exploration of ancient Hindu temple architecture and its evolution through different dynasties.'
};

const cultureInput: CreateEducationalContentInput = {
  title: 'Traditional Hindu Festivals',
  category: 'culture',
  content: 'Understanding the cultural significance and traditions of major Hindu festivals celebrated throughout the year.'
};

const philosophyInput: CreateEducationalContentInput = {
  title: 'Vedic Philosophy Basics',
  category: 'philosophy',
  content: 'An introduction to the fundamental concepts of Vedic philosophy and its practical applications in daily life.'
};

describe('createEducationalContent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create educational content with history category', async () => {
    const result = await createEducationalContent(historyInput);

    // Basic field validation
    expect(result.title).toEqual('Ancient Temple Architecture');
    expect(result.category).toEqual('history');
    expect(result.content).toEqual(historyInput.content);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create educational content with culture category', async () => {
    const result = await createEducationalContent(cultureInput);

    expect(result.title).toEqual('Traditional Hindu Festivals');
    expect(result.category).toEqual('culture');
    expect(result.content).toEqual(cultureInput.content);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create educational content with philosophy category', async () => {
    const result = await createEducationalContent(philosophyInput);

    expect(result.title).toEqual('Vedic Philosophy Basics');
    expect(result.category).toEqual('philosophy');
    expect(result.content).toEqual(philosophyInput.content);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save educational content to database', async () => {
    const result = await createEducationalContent(historyInput);

    // Query the database to verify content was saved
    const savedContent = await db.select()
      .from(educationalContentTable)
      .where(eq(educationalContentTable.id, result.id))
      .execute();

    expect(savedContent).toHaveLength(1);
    expect(savedContent[0].title).toEqual('Ancient Temple Architecture');
    expect(savedContent[0].category).toEqual('history');
    expect(savedContent[0].content).toEqual(historyInput.content);
    expect(savedContent[0].created_at).toBeInstanceOf(Date);
    expect(savedContent[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple educational contents with different categories', async () => {
    // Create content in different categories
    const historyResult = await createEducationalContent(historyInput);
    const cultureResult = await createEducationalContent(cultureInput);
    const philosophyResult = await createEducationalContent(philosophyInput);

    // Verify all have different IDs
    expect(historyResult.id).not.toEqual(cultureResult.id);
    expect(cultureResult.id).not.toEqual(philosophyResult.id);
    expect(historyResult.id).not.toEqual(philosophyResult.id);

    // Verify all were saved to database
    const allContent = await db.select()
      .from(educationalContentTable)
      .execute();

    expect(allContent).toHaveLength(3);
    
    // Check that all categories are represented
    const categories = allContent.map(content => content.category);
    expect(categories).toContain('history');
    expect(categories).toContain('culture');
    expect(categories).toContain('philosophy');
  });

  it('should set created_at and updated_at timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createEducationalContent(historyInput);
    const afterCreation = new Date();

    // Check that timestamps are within expected range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // Initially, created_at and updated_at should be the same or very close
    const timeDifference = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
  });

  it('should handle all valid content categories', async () => {
    const validCategories: ContentCategory[] = [
      'history', 'culture', 'traditions', 'festivals', 
      'architecture', 'ceremonies', 'philosophy', 'general'
    ];

    // Test creating content for each valid category
    for (const category of validCategories) {
      const testInput: CreateEducationalContentInput = {
        title: `Test Content for ${category}`,
        category: category,
        content: `This is test content for the ${category} category.`
      };

      const result = await createEducationalContent(testInput);
      expect(result.category).toEqual(category);
      expect(result.title).toEqual(`Test Content for ${category}`);
    }
  });
});