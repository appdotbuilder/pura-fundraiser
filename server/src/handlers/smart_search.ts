import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type SmartSearchInput, type SmartSearchResponse } from '../schema';
import { and, eq, ilike, or } from 'drizzle-orm';

export async function smartSearch(input: SmartSearchInput): Promise<SmartSearchResponse> {
  try {
    // Create search conditions
    const queryWords = input.query.toLowerCase().split(/\s+/).filter(word => word.length > 1);
    const fullPhrase = `%${input.query.toLowerCase()}%`;

    // Search for full phrase or any individual words
    const searchConditions = [
      ilike(educationalContentTable.title, fullPhrase),
      ilike(educationalContentTable.content, fullPhrase)
    ];

    // Add individual word searches
    for (const word of queryWords) {
      const wordPattern = `%${word}%`;
      searchConditions.push(
        ilike(educationalContentTable.title, wordPattern),
        ilike(educationalContentTable.content, wordPattern)
      );
    }

    const textSearchCondition = or(...searchConditions);

    // Execute query with appropriate conditions
    const results = input.category
      ? await db.select()
          .from(educationalContentTable)
          .where(
            and(
              textSearchCondition,
              eq(educationalContentTable.category, input.category)
            )
          )
          .execute()
      : await db.select()
          .from(educationalContentTable)
          .where(textSearchCondition)
          .execute();

    // Calculate relevance scores and create excerpts
    const searchResults = results.map(content => {
      const relevanceScore = calculateRelevanceScore(input.query, content);
      const excerpt = createExcerpt(input.query, content.content);

      return {
        content,
        relevanceScore,
        excerpt
      };
    });

    // Sort by relevance score (highest first)
    const sortedResults = searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      query: input.query,
      results: sortedResults,
      total: sortedResults.length
    };
  } catch (error) {
    console.error('Smart search failed:', error);
    throw error;
  }
}

/**
 * Calculate relevance score based on query matches in title and content
 */
function calculateRelevanceScore(query: string, content: any): number {
  const queryLower = query.toLowerCase();
  const titleLower = content.title.toLowerCase();
  const contentLower = content.content.toLowerCase();

  let score = 0;

  // Title matches are weighted more heavily (0.6 weight)
  const titleMatches = countMatches(titleLower, queryLower);
  score += titleMatches * 0.6;

  // Content matches have lower weight (0.4 weight)
  const contentMatches = countMatches(contentLower, queryLower);
  score += contentMatches * 0.4;

  // Bonus for exact phrase match in title
  if (titleLower.includes(queryLower)) {
    score += 0.3;
  }

  // Bonus for exact phrase match in content
  if (contentLower.includes(queryLower)) {
    score += 0.2;
  }

  // Normalize score to 0-1 range
  const maxPossibleScore = 2.0; // Theoretical maximum
  return Math.min(score / maxPossibleScore, 1.0);
}

/**
 * Count the number of word matches between query and text
 */
function countMatches(text: string, query: string): number {
  const queryWords = query.split(/\s+/).filter(word => word.length > 1); // Include 2+ character words
  let matches = 0;

  for (const word of queryWords) {
    // Clean word of punctuation for matching
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 0) {
      const regex = new RegExp(`\\b${cleanWord}\\b`, 'gi');
      const wordMatches = text.match(regex);
      matches += wordMatches ? wordMatches.length : 0;
    }
  }

  return matches;
}

/**
 * Create a relevant excerpt from content based on the search query
 */
function createExcerpt(query: string, content: string, maxLength: number = 200): string {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();

  // Find the first occurrence of the query or any query word
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);
  let bestMatchIndex = -1;
  let bestMatchLength = 0;

  // Look for the best match (longest query substring)
  for (const word of queryWords) {
    const cleanWord = word.replace(/[^\w]/g, '');
    const index = contentLower.indexOf(cleanWord);
    if (index !== -1 && cleanWord.length > bestMatchLength) {
      bestMatchIndex = index;
      bestMatchLength = cleanWord.length;
    }
  }

  // If no word match found, check for phrase match
  if (bestMatchIndex === -1) {
    bestMatchIndex = contentLower.indexOf(queryLower);
  }

  // If still no match, start from beginning
  if (bestMatchIndex === -1) {
    bestMatchIndex = 0;
  }

  // Create excerpt around the match
  const startIndex = Math.max(0, bestMatchIndex - 50);
  const endIndex = Math.min(content.length, startIndex + maxLength);

  let excerpt = content.substring(startIndex, endIndex);

  // Add ellipsis if we're not at the beginning or end
  if (startIndex > 0) {
    excerpt = '...' + excerpt;
  }
  if (endIndex < content.length) {
    excerpt = excerpt + '...';
  }

  return excerpt.trim();
}