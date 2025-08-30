import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type CreateEducationalContentInput } from '../schema';
import { deleteEducationalContent } from '../handlers/delete_educational_content';
import { eq } from 'drizzle-orm';

// Test input for creating educational content
const testInput: CreateEducationalContentInput = {
  title: 'Test Content',
  category: 'history',
  content: 'This is test content for educational purposes'
};

describe('deleteEducationalContent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete existing educational content and return true', async () => {
    // First create content to delete
    const createResult = await db.insert(educationalContentTable)
      .values({
        title: testInput.title,
        category: testInput.category,
        content: testInput.content
      })
      .returning()
      .execute();

    const contentId = createResult[0].id;

    // Delete the content
    const deleteResult = await deleteEducationalContent(contentId);

    expect(deleteResult).toBe(true);

    // Verify content was actually deleted
    const remainingContent = await db.select()
      .from(educationalContentTable)
      .where(eq(educationalContentTable.id, contentId))
      .execute();

    expect(remainingContent).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent content', async () => {
    // Try to delete content with ID that doesn't exist
    const deleteResult = await deleteEducationalContent(99999);

    expect(deleteResult).toBe(false);
  });

  it('should verify database state remains unchanged for non-existent ID', async () => {
    // Create some content first
    await db.insert(educationalContentTable)
      .values([
        {
          title: 'Content 1',
          category: 'history',
          content: 'First content'
        },
        {
          title: 'Content 2',
          category: 'culture',
          content: 'Second content'
        }
      ])
      .execute();

    // Get initial count
    const initialCount = await db.select()
      .from(educationalContentTable)
      .execute();

    // Try to delete non-existent content
    const deleteResult = await deleteEducationalContent(99999);

    // Verify no change in database
    expect(deleteResult).toBe(false);

    const finalCount = await db.select()
      .from(educationalContentTable)
      .execute();

    expect(finalCount).toHaveLength(initialCount.length);
    expect(finalCount).toHaveLength(2);
  });

  it('should delete specific content without affecting others', async () => {
    // Create multiple content entries
    const createResult = await db.insert(educationalContentTable)
      .values([
        {
          title: 'Content to Delete',
          category: 'history',
          content: 'This will be deleted'
        },
        {
          title: 'Content to Keep',
          category: 'culture',
          content: 'This should remain'
        }
      ])
      .returning()
      .execute();

    const contentToDeleteId = createResult[0].id;
    const contentToKeepId = createResult[1].id;

    // Delete specific content
    const deleteResult = await deleteEducationalContent(contentToDeleteId);

    expect(deleteResult).toBe(true);

    // Verify deleted content is gone
    const deletedContent = await db.select()
      .from(educationalContentTable)
      .where(eq(educationalContentTable.id, contentToDeleteId))
      .execute();

    expect(deletedContent).toHaveLength(0);

    // Verify other content remains
    const remainingContent = await db.select()
      .from(educationalContentTable)
      .where(eq(educationalContentTable.id, contentToKeepId))
      .execute();

    expect(remainingContent).toHaveLength(1);
    expect(remainingContent[0].title).toEqual('Content to Keep');
  });

  it('should handle deletion of content with different categories', async () => {
    // Create content with different categories
    const createResult = await db.insert(educationalContentTable)
      .values([
        {
          title: 'History Content',
          category: 'history',
          content: 'Historical information'
        },
        {
          title: 'Festival Content',
          category: 'festivals',
          content: 'Festival information'
        },
        {
          title: 'Philosophy Content',
          category: 'philosophy',
          content: 'Philosophical insights'
        }
      ])
      .returning()
      .execute();

    // Delete middle content (festivals)
    const festivalContentId = createResult[1].id;
    const deleteResult = await deleteEducationalContent(festivalContentId);

    expect(deleteResult).toBe(true);

    // Verify only festival content was deleted
    const allContent = await db.select()
      .from(educationalContentTable)
      .execute();

    expect(allContent).toHaveLength(2);
    
    const categories = allContent.map(content => content.category);
    expect(categories).toContain('history');
    expect(categories).toContain('philosophy');
    expect(categories).not.toContain('festivals');
  });
});