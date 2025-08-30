import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type SmartSearchInput } from '../schema';
import { smartSearch } from '../handlers/smart_search';

describe('smartSearch', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test content
  const testContent = [
    {
      title: 'Hindu Temple Architecture',
      category: 'architecture' as const,
      content: 'Hindu temples are sacred structures designed according to ancient architectural principles called Vastu Shastra. These magnificent buildings feature intricate carvings, towering spires called shikhara, and sacred spaces for worship and meditation.'
    },
    {
      title: 'Diwali Festival Celebrations',
      category: 'festivals' as const,
      content: 'Diwali, the festival of lights, is one of the most important Hindu celebrations. Families light oil lamps called diyas, exchange sweets, and perform prayers to goddess Lakshmi for prosperity and happiness.'
    },
    {
      title: 'Yoga and Meditation Philosophy',
      category: 'philosophy' as const,
      content: 'Yoga is an ancient practice that combines physical postures, breathing techniques, and meditation. The word yoga means union, representing the connection between mind, body, and spirit in Hindu philosophy.'
    },
    {
      title: 'Traditional Dance Forms',
      category: 'culture' as const,
      content: 'Classical Indian dance forms like Bharatanatyam, Kathak, and Odissi are deeply rooted in Hindu traditions. These dances tell stories from ancient epics through graceful movements and expressions.'
    }
  ];

  const seedTestData = async () => {
    for (const content of testContent) {
      await db.insert(educationalContentTable)
        .values(content)
        .execute();
    }
  };

  it('should search content by title match', async () => {
    await seedTestData();

    const input: SmartSearchInput = {
      query: 'Temple Architecture'
    };

    const result = await smartSearch(input);

    expect(result.query).toEqual('Temple Architecture');
    expect(result.total).toEqual(1);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].content.title).toEqual('Hindu Temple Architecture');
    expect(result.results[0].relevanceScore).toBeGreaterThan(0);
    expect(result.results[0].excerpt).toContain('Hindu temples');
  });

  it('should search content by content text match', async () => {
    await seedTestData();

    const input: SmartSearchInput = {
      query: 'meditation'
    };

    const result = await smartSearch(input);

    expect(result.query).toEqual('meditation');
    expect(result.total).toEqual(2); // Should match both yoga article and temple article
    expect(result.results[0].relevanceScore).toBeGreaterThan(0);
    expect(result.results.some(r => r.content.title.includes('Yoga'))).toBe(true);
  });

  it('should filter by category', async () => {
    await seedTestData();

    const input: SmartSearchInput = {
      query: 'ancient',
      category: 'philosophy'
    };

    const result = await smartSearch(input);

    expect(result.query).toEqual('ancient');
    expect(result.total).toEqual(1);
    expect(result.results[0].content.category).toEqual('philosophy');
    expect(result.results[0].content.title).toEqual('Yoga and Meditation Philosophy');
  });

  it('should return results sorted by relevance score', async () => {
    await seedTestData();

    const input: SmartSearchInput = {
      query: 'Hindu'
    };

    const result = await smartSearch(input);

    expect(result.total).toBeGreaterThan(1);
    
    // Results should be sorted by relevance score (descending)
    for (let i = 1; i < result.results.length; i++) {
      expect(result.results[i-1].relevanceScore).toBeGreaterThanOrEqual(result.results[i].relevanceScore);
    }

    // The temple article with "Hindu" in title should score higher than content-only matches
    const templeResult = result.results.find(r => r.content.title.includes('Temple'));
    const danceResult = result.results.find(r => r.content.title.includes('Dance'));
    
    if (templeResult && danceResult) {
      expect(templeResult.relevanceScore).toBeGreaterThan(danceResult.relevanceScore);
    }
  });

  it('should handle case-insensitive search', async () => {
    await seedTestData();

    const input: SmartSearchInput = {
      query: 'DIWALI'
    };

    const result = await smartSearch(input);

    expect(result.total).toEqual(1);
    expect(result.results[0].content.title).toEqual('Diwali Festival Celebrations');
  });

  it('should create relevant excerpts', async () => {
    await seedTestData();

    const input: SmartSearchInput = {
      query: 'Vastu Shastra'
    };

    const result = await smartSearch(input);

    expect(result.total).toEqual(1);
    expect(result.results[0].excerpt).toContain('Vastu Shastra');
    expect(result.results[0].excerpt.length).toBeLessThanOrEqual(220); // Max length + ellipsis
  });

  it('should handle multi-word queries', async () => {
    await seedTestData();

    const input: SmartSearchInput = {
      query: 'festival lights'
    };

    const result = await smartSearch(input);

    expect(result.total).toEqual(1);
    expect(result.results[0].content.title).toEqual('Diwali Festival Celebrations');
    expect(result.results[0].relevanceScore).toBeGreaterThan(0);
  });

  it('should return empty results for non-matching query', async () => {
    await seedTestData();

    const input: SmartSearchInput = {
      query: 'nonexistent topic'
    };

    const result = await smartSearch(input);

    expect(result.query).toEqual('nonexistent topic');
    expect(result.total).toEqual(0);
    expect(result.results).toHaveLength(0);
  });

  it('should handle empty database', async () => {
    // Don't seed any data

    const input: SmartSearchInput = {
      query: 'anything'
    };

    const result = await smartSearch(input);

    expect(result.query).toEqual('anything');
    expect(result.total).toEqual(0);
    expect(result.results).toHaveLength(0);
  });

  it('should calculate different relevance scores based on match quality', async () => {
    // Create specific content for relevance testing
    await db.insert(educationalContentTable)
      .values({
        title: 'Yoga Practice Guide', // Exact title match
        category: 'philosophy',
        content: 'A comprehensive guide to yoga practice and techniques.'
      })
      .execute();

    await db.insert(educationalContentTable)
      .values({
        title: 'Ancient Practices',
        category: 'philosophy', 
        content: 'Yoga has been practiced for thousands of years as a spiritual discipline.' // Content match
      })
      .execute();

    const input: SmartSearchInput = {
      query: 'yoga'
    };

    const result = await smartSearch(input);

    expect(result.total).toEqual(2);
    
    const titleMatch = result.results.find(r => r.content.title.includes('Yoga'));
    const contentMatch = result.results.find(r => r.content.title.includes('Ancient'));

    // Title matches should score higher than content-only matches
    expect(titleMatch!.relevanceScore).toBeGreaterThan(contentMatch!.relevanceScore);
  });

  it('should handle queries with special characters', async () => {
    await seedTestData();

    const input: SmartSearchInput = {
      query: 'mind, body'
    };

    const result = await smartSearch(input);

    expect(result.total).toBeGreaterThanOrEqual(0); // Should not throw error
    expect(result.query).toEqual('mind, body');
  });
});