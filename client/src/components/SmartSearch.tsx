import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Search, MessageCircle, BookOpen, Sparkles, Filter, Calendar, Star } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { SmartSearchResponse, SmartSearchResult, ContentCategory } from '../../../server/src/schema';

const categoryOptions: { value: ContentCategory; label: string; emoji: string }[] = [
  { value: 'history', label: 'History', emoji: '📜' },
  { value: 'culture', label: 'Culture', emoji: '🎭' },
  { value: 'traditions', label: 'Traditions', emoji: '🕯️' },
  { value: 'festivals', label: 'Festivals', emoji: '🎉' },
  { value: 'architecture', label: 'Architecture', emoji: '🏛️' },
  { value: 'ceremonies', label: 'Ceremonies', emoji: '🙏' },
  { value: 'philosophy', label: 'Philosophy', emoji: '💭' },
  { value: 'general', label: 'General', emoji: '📚' }
];

const categoryColors: Record<ContentCategory, string> = {
  history: 'bg-amber-100 text-amber-800',
  culture: 'bg-purple-100 text-purple-800',
  traditions: 'bg-orange-100 text-orange-800',
  festivals: 'bg-pink-100 text-pink-800',
  architecture: 'bg-blue-100 text-blue-800',
  ceremonies: 'bg-green-100 text-green-800',
  philosophy: 'bg-indigo-100 text-indigo-800',
  general: 'bg-gray-100 text-gray-800'
};

const sampleQuestions = [
  "What is the significance of Galungan festival?",
  "Tell me about Balinese temple architecture",
  "What are the main Hindu ceremonies in Bali?",
  "Explain the philosophy behind Tri Hita Karana",
  "What is the history of Hindu arrival in Bali?",
  "Describe traditional Balinese cultural practices"
];

export function SmartSearch() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | 'all'>('all');
  const [searchResults, setSearchResults] = useState<SmartSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    if (!queryToSearch.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const results = await trpc.smartSearch.query({
        query: queryToSearch.trim(),
        category: selectedCategory === 'all' ? undefined : selectedCategory
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to perform search:', error);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleQuestionClick = (question: string) => {
    setQuery(question);
    handleSearch(question);
  };

  const getRelevanceDisplay = (score: number) => {
    const percentage = Math.round(score * 100);
    let color = 'bg-gray-100 text-gray-700';
    let label = 'Low';
    
    if (percentage >= 80) {
      color = 'bg-green-100 text-green-700';
      label = 'High';
    } else if (percentage >= 60) {
      color = 'bg-yellow-100 text-yellow-700';
      label = 'Medium';
    }
    
    return { color, label, percentage };
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Sparkles className="h-5 w-5" />
            Ask About Hindu Bali Culture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Ask a question about Hindu Bali culture, traditions, or practices..."
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  className="bg-white"
                />
              </div>
              <Select 
                value={selectedCategory} 
                onValueChange={(value: string) => setSelectedCategory(value as ContentCategory | 'all')}
              >
                <SelectTrigger className="w-48 bg-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Any category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any category</SelectItem>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span>{option.emoji}</span>
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="submit" 
                disabled={!query.trim() || isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {/* Sample Questions */}
          {!hasSearched && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 font-medium">
                <MessageCircle className="h-4 w-4 inline mr-1" />
                Try asking these questions:
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {sampleQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuestionClick(question)}
                    className="justify-start text-left h-auto py-2 px-3 bg-white hover:bg-orange-50 hover:border-orange-300"
                  >
                    <span className="text-xs leading-relaxed">{question}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin h-6 w-6 border-2 border-orange-600 border-t-transparent rounded-full" />
              <span className="text-gray-600">Searching through educational content...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {searchResults && !isLoading && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results for "{searchResults.query}"
              </h3>
              <p className="text-sm text-gray-600">
                Found {searchResults.total} relevant {searchResults.total === 1 ? 'article' : 'articles'}
                {selectedCategory !== 'all' && ` in ${categoryOptions.find(c => c.value === selectedCategory)?.label}`}
              </p>
            </div>
          </div>

          {/* Results List */}
          {searchResults.results.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any content matching your query. Try:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Using different keywords</li>
                  <li>• Removing the category filter</li>
                  <li>• Asking about general Hindu Bali topics</li>
                </ul>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {searchResults.results.map((result: SmartSearchResult) => {
                const relevance = getRelevanceDisplay(result.relevanceScore);
                
                return (
                  <Card key={result.content.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-900 mb-2">
                            {result.content.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={categoryColors[result.content.category]}>
                              {categoryOptions.find(cat => cat.value === result.content.category)?.emoji}{' '}
                              {categoryOptions.find(cat => cat.value === result.content.category)?.label}
                            </Badge>
                            <Badge variant="outline" className={relevance.color}>
                              <Star className="h-3 w-3 mr-1" />
                              {relevance.label} ({relevance.percentage}%)
                            </Badge>
                            <div className="flex items-center text-xs text-gray-500 gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{result.content.created_at.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        {/* Excerpt */}
                        <div className="bg-orange-50 p-3 rounded-md border border-orange-100">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            <span className="font-medium text-orange-800">Relevant excerpt:</span>{' '}
                            {result.excerpt}
                          </p>
                        </div>
                        
                        <Separator />
                        
                        {/* Full Content Preview */}
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-600 leading-relaxed line-clamp-4">
                            {result.content.content}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {hasSearched && !isLoading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full shrink-0">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">About Smart Search</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  This smart search analyzes your questions and finds the most relevant educational content 
                  about Hindu Bali culture. The relevance score shows how well each article matches your query. 
                  This serves as a foundation for future AI chat capabilities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}