import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type CreateEducationalContentInput } from '../schema';
import { getEducationalContent } from '../handlers/get_educational_content';

// Test data for different categories
const historyContent: CreateEducationalContentInput = {
  title: 'Ancient Temple Architecture',
  category: 'history',
  content: 'Historical significance of temple construction techniques...'
};

const cultureContent: CreateEducationalContentInput = {
  title: 'Traditional Festivals',
  category: 'culture',
  content: 'Cultural importance of seasonal celebrations...'
};

const philosophyContent: CreateEducationalContentInput = {
  title: 'Spiritual Philosophy',
  category: 'philosophy',
  content: 'Core philosophical principles and teachings...'
};

describe('getEducationalContent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all educational content when no category specified', async () => {
    // Create test content in different categories
    await db.insert(educationalContentTable).values([
      {
        title: historyContent.title,
        category: historyContent.category,
        content: historyContent.content
      },
      {
        title: cultureContent.title,
        category: cultureContent.category,
        content: cultureContent.content
      },
      {
        title: philosophyContent.title,
        category: philosophyContent.category,
        content: philosophyContent.content
      }
    ]).execute();

    const result = await getEducationalContent();

    expect(result).toHaveLength(3);
    expect(result.map(c => c.category)).toContain('history');
    expect(result.map(c => c.category)).toContain('culture');
    expect(result.map(c => c.category)).toContain('philosophy');

    // Verify all required fields are present
    result.forEach(content => {
      expect(content.id).toBeDefined();
      expect(content.title).toBeDefined();
      expect(content.category).toBeDefined();
      expect(content.content).toBeDefined();
      expect(content.created_at).toBeInstanceOf(Date);
      expect(content.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return content filtered by category', async () => {
    // Create test content in different categories
    await db.insert(educationalContentTable).values([
      {
        title: historyContent.title,
        category: historyContent.category,
        content: historyContent.content
      },
      {
        title: cultureContent.title,
        category: cultureContent.category,
        content: cultureContent.content
      }
    ]).execute();

    const result = await getEducationalContent('history');

    expect(result).toHaveLength(1);
    expect(result[0].category).toEqual('history');
    expect(result[0].title).toEqual('Ancient Temple Architecture');
    expect(result[0].content).toEqual(historyContent.content);
  });

  it('should return empty array when no content matches category', async () => {
    // Create content in one category
    await db.insert(educationalContentTable).values({
      title: historyContent.title,
      category: historyContent.category,
      content: historyContent.content
    }).execute();

    const result = await getEducationalContent('architecture');

    expect(result).toHaveLength(0);
  });

  it('should return content ordered by creation date (most recent first)', async () => {
    // Create content with different timestamps
    const firstContent = await db.insert(educationalContentTable).values({
      title: 'First Content',
      category: 'history',
      content: 'First content created'
    }).returning().execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondContent = await db.insert(educationalContentTable).values({
      title: 'Second Content',
      category: 'culture',
      content: 'Second content created'
    }).returning().execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdContent = await db.insert(educationalContentTable).values({
      title: 'Third Content',
      category: 'philosophy',
      content: 'Third content created'
    }).returning().execute();

    const result = await getEducationalContent();

    expect(result).toHaveLength(3);
    // Most recent first - third, second, first
    expect(result[0].title).toEqual('Third Content');
    expect(result[1].title).toEqual('Second Content');
    expect(result[2].title).toEqual('First Content');

    // Verify timestamps are in descending order
    expect(result[0].created_at.getTime()).toBeGreaterThanOrEqual(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeGreaterThanOrEqual(result[2].created_at.getTime());
  });

  it('should return empty array when no content exists', async () => {
    const result = await getEducationalContent();

    expect(result).toHaveLength(0);
  });

  it('should handle all valid content categories', async () => {
    const categories = ['history', 'culture', 'traditions', 'festivals', 'architecture', 'ceremonies', 'philosophy', 'general'] as const;
    
    // Create content for each category
    for (const category of categories) {
      await db.insert(educationalContentTable).values({
        title: `${category} content`,
        category: category,
        content: `Content about ${category}`
      }).execute();
    }

    // Test filtering by each category
    for (const category of categories) {
      const result = await getEducationalContent(category);
      
      expect(result).toHaveLength(1);
      expect(result[0].category).toEqual(category);
      expect(result[0].title).toEqual(`${category} content`);
    }
  });

  it('should preserve content with null/empty strings in optional fields', async () => {
    // Create content with minimal required fields
    await db.insert(educationalContentTable).values({
      title: 'Minimal Content',
      category: 'general',
      content: 'Basic content text'
    }).execute();

    const result = await getEducationalContent('general');

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Minimal Content');
    expect(result[0].category).toEqual('general');
    expect(result[0].content).toEqual('Basic content text');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});