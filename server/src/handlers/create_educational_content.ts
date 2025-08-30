import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type CreateEducationalContentInput, type EducationalContent } from '../schema';

export const createEducationalContent = async (input: CreateEducationalContentInput): Promise<EducationalContent> => {
  try {
    // Insert educational content record
    const result = await db.insert(educationalContentTable)
      .values({
        title: input.title,
        category: input.category,
        content: input.content
        // created_at and updated_at will be automatically set by database defaults
      })
      .returning()
      .execute();

    // Return the created educational content
    const educationalContent = result[0];
    return educationalContent;
  } catch (error) {
    console.error('Educational content creation failed:', error);
    throw error;
  }
};