import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type CreateEducationalContentInput, type UpdateEducationalContentInput } from '../schema';
import { updateEducationalContent } from '../handlers/update_educational_content';
import { eq } from 'drizzle-orm';

// Helper function to create test educational content
async function createTestContent(input: CreateEducationalContentInput) {
  const result = await db.insert(educationalContentTable)
    .values({
      title: input.title,
      category: input.category,
      content: input.content
    })
    .returning()
    .execute();
  
  return result[0];
}

const testContentInput: CreateEducationalContentInput = {
  title: 'Test Educational Content',
  category: 'history',
  content: 'This is test educational content about Hindu history.'
};

describe('updateEducationalContent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update educational content with all fields', async () => {
    // Create test content first
    const createdContent = await createTestContent(testContentInput);

    const updateInput: UpdateEducationalContentInput = {
      id: createdContent.id,
      title: 'Updated Educational Content',
      category: 'culture',
      content: 'This is updated educational content about Hindu culture.'
    };

    const result = await updateEducationalContent(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdContent.id);
    expect(result!.title).toEqual('Updated Educational Content');
    expect(result!.category).toEqual('culture');
    expect(result!.content).toEqual('This is updated educational content about Hindu culture.');
    expect(result!.created_at).toEqual(createdContent.created_at);
    expect(result!.updated_at).not.toEqual(createdContent.updated_at);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create test content first
    const createdContent = await createTestContent(testContentInput);

    const updateInput: UpdateEducationalContentInput = {
      id: createdContent.id,
      title: 'Partially Updated Title'
    };

    const result = await updateEducationalContent(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdContent.id);
    expect(result!.title).toEqual('Partially Updated Title');
    expect(result!.category).toEqual('history'); // Should remain unchanged
    expect(result!.content).toEqual(testContentInput.content); // Should remain unchanged
    expect(result!.created_at).toEqual(createdContent.created_at);
    expect(result!.updated_at).not.toEqual(createdContent.updated_at);
  });

  it('should update category only', async () => {
    // Create test content first
    const createdContent = await createTestContent(testContentInput);

    const updateInput: UpdateEducationalContentInput = {
      id: createdContent.id,
      category: 'festivals'
    };

    const result = await updateEducationalContent(updateInput);

    expect(result).not.toBeNull();
    expect(result!.category).toEqual('festivals');
    expect(result!.title).toEqual(testContentInput.title); // Should remain unchanged
    expect(result!.content).toEqual(testContentInput.content); // Should remain unchanged
    expect(result!.updated_at).not.toEqual(createdContent.updated_at);
  });

  it('should update content only', async () => {
    // Create test content first
    const createdContent = await createTestContent(testContentInput);

    const updateInput: UpdateEducationalContentInput = {
      id: createdContent.id,
      content: 'This is completely new educational content.'
    };

    const result = await updateEducationalContent(updateInput);

    expect(result).not.toBeNull();
    expect(result!.content).toEqual('This is completely new educational content.');
    expect(result!.title).toEqual(testContentInput.title); // Should remain unchanged
    expect(result!.category).toEqual(testContentInput.category); // Should remain unchanged
    expect(result!.updated_at).not.toEqual(createdContent.updated_at);
  });

  it('should return null for non-existent content', async () => {
    const updateInput: UpdateEducationalContentInput = {
      id: 99999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateEducationalContent(updateInput);

    expect(result).toBeNull();
  });

  it('should save updated content to database', async () => {
    // Create test content first
    const createdContent = await createTestContent(testContentInput);

    const updateInput: UpdateEducationalContentInput = {
      id: createdContent.id,
      title: 'Database Updated Title',
      category: 'ceremonies'
    };

    const result = await updateEducationalContent(updateInput);

    // Verify in database
    const contentInDb = await db.select()
      .from(educationalContentTable)
      .where(eq(educationalContentTable.id, createdContent.id))
      .execute();

    expect(contentInDb).toHaveLength(1);
    expect(contentInDb[0].title).toEqual('Database Updated Title');
    expect(contentInDb[0].category).toEqual('ceremonies');
    expect(contentInDb[0].content).toEqual(testContentInput.content); // Should remain unchanged
    expect(contentInDb[0].updated_at).toEqual(result!.updated_at);
    expect(contentInDb[0].updated_at).not.toEqual(createdContent.updated_at);
  });

  it('should update with different content categories', async () => {
    // Create test content first
    const createdContent = await createTestContent(testContentInput);

    // Test updating to each category
    const categories: Array<'culture' | 'traditions' | 'festivals' | 'architecture' | 'ceremonies' | 'philosophy' | 'general'> = [
      'culture', 'traditions', 'festivals', 'architecture', 'ceremonies', 'philosophy', 'general'
    ];
    
    for (const category of categories) {
      const updateInput: UpdateEducationalContentInput = {
        id: createdContent.id,
        category: category
      };

      const result = await updateEducationalContent(updateInput);

      expect(result).not.toBeNull();
      expect(result!.category).toEqual(category);
    }
  });

  it('should always update the updated_at timestamp even with no field changes', async () => {
    // Create test content first
    const createdContent = await createTestContent(testContentInput);

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateEducationalContentInput = {
      id: createdContent.id
      // No fields to update, only ID provided
    };

    const result = await updateEducationalContent(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at).not.toEqual(createdContent.updated_at);
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdContent.updated_at.getTime());
  });
});