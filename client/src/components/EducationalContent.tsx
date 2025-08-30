import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Edit, Trash2, Calendar, Filter } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { CreateContentDialog } from '@/components/CreateContentDialog';
import { EditContentDialog } from '@/components/EditContentDialog';
import type { EducationalContent as EducationalContentType, ContentCategory } from '../../../server/src/schema';

const categoryLabels: Record<ContentCategory, string> = {
  history: '📜 History',
  culture: '🎭 Culture',
  traditions: '🕯️ Traditions',
  festivals: '🎉 Festivals',
  architecture: '🏛️ Architecture',
  ceremonies: '🙏 Ceremonies',
  philosophy: '💭 Philosophy',
  general: '📚 General'
};

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

export function EducationalContent() {
  const [content, setContent] = useState<EducationalContentType[]>([]);
  const [filteredContent, setFilteredContent] = useState<EducationalContentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState<EducationalContentType | null>(null);

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getEducationalContent.query();
      setContent(result);
      setFilteredContent(result);
    } catch (error) {
      console.error('Failed to load educational content:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredContent(content);
    } else {
      setFilteredContent(content.filter((item: EducationalContentType) => item.category === selectedCategory));
    }
  }, [content, selectedCategory]);

  const handleContentCreated = useCallback((newContent: EducationalContentType) => {
    setContent((prev: EducationalContentType[]) => [...prev, newContent]);
  }, []);

  const handleContentUpdated = useCallback((updatedContent: EducationalContentType) => {
    setContent((prev: EducationalContentType[]) => 
      prev.map((item: EducationalContentType) => 
        item.id === updatedContent.id ? updatedContent : item
      )
    );
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    try {
      await trpc.deleteEducationalContent.mutate({ id });
      setContent((prev: EducationalContentType[]) => 
        prev.filter((item: EducationalContentType) => item.id !== id)
      );
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  const truncateContent = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter and Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Hindu Bali Cultural Content
          </h2>
          <p className="text-sm text-gray-600">
            {filteredContent.length} articles • Learn about Balinese Hindu traditions and culture
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedCategory} onValueChange={(value: ContentCategory | 'all') => setSelectedCategory(value)}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(categoryLabels).map(([category, label]) => (
                <SelectItem key={category} value={category}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedCategory === 'all' ? 'No content available yet' : `No content in "${categoryLabels[selectedCategory as ContentCategory]}" category`}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedCategory === 'all' 
                ? 'Start building your educational content library by adding articles about Hindu Bali culture.'
                : 'Try selecting a different category or add new content to this category.'
              }
            </p>
            {selectedCategory === 'all' && (
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Article
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredContent.map((item: EducationalContentType) => (
            <Card 
              key={item.id} 
              className="hover:shadow-lg transition-shadow duration-200 border-orange-100"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={categoryColors[item.category]}>
                    {categoryLabels[item.category]}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedContent(item);
                        setShowEditDialog(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <CardTitle className="text-lg text-gray-900 line-clamp-2">
                  {item.title}
                </CardTitle>
                
                <div className="flex items-center text-xs text-gray-500 gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Created {item.created_at.toLocaleDateString()}</span>
                  {item.updated_at.getTime() !== item.created_at.getTime() && (
                    <span>• Updated {item.updated_at.toLocaleDateString()}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed">
                  {truncateContent(item.content)}
                </p>
                
                {item.content.length > 200 && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto mt-2 text-orange-600 hover:text-orange-700"
                    onClick={() => {
                      setSelectedContent(item);
                      setShowEditDialog(true);
                    }}
                  >
                    Read more →
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateContentDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onContentCreated={handleContentCreated}
      />

      {selectedContent && (
        <EditContentDialog 
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          content={selectedContent}
          onContentUpdated={handleContentUpdated}
        />
      )}
    </div>
  );
}