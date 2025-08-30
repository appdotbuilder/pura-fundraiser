import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Tag, Calendar, Eye } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { UpdateEducationalContentInput, EducationalContent, ContentCategory } from '../../../server/src/schema';

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

interface EditContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: EducationalContent;
  onContentUpdated: (content: EducationalContent) => void;
}

export function EditContentDialog({ open, onOpenChange, content, onContentUpdated }: EditContentDialogProps) {
  const [formData, setFormData] = useState<UpdateEducationalContentInput>({
    id: content.id,
    title: content.title,
    category: content.category,
    content: content.content
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);

  useEffect(() => {
    setFormData({
      id: content.id,
      title: content.title,
      category: content.category,
      content: content.content
    });
    setIsViewMode(true);
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Only send fields that are defined and have changed
      const updateData: UpdateEducationalContentInput = {
        id: content.id,
        ...(formData.title !== undefined && formData.title !== content.title && { title: formData.title }),
        ...(formData.category !== undefined && formData.category !== content.category && { category: formData.category }),
        ...(formData.content !== undefined && formData.content !== content.content && { content: formData.content })
      };
      
      const updatedContent = await trpc.updateEducationalContent.mutate(updateData);
      if (updatedContent) {
        onContentUpdated(updatedContent);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update content:', error);
      // In a real app, you'd show an error message to the user
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = (
    (formData.title || '') !== content.title ||
    (formData.category || content.category) !== content.category ||
    (formData.content || '') !== content.content
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-orange-800 pr-4">
                <BookOpen className="h-5 w-5" />
                {isViewMode ? 'View Content' : 'Edit Content'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isViewMode ? 'Reading content details' : 'Update the educational content information'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={categoryColors[content.category]}>
                {(() => {
                  const categoryOption = categoryOptions.find(cat => cat.value === content.category);
                  return categoryOption ? `${categoryOption.emoji} ${categoryOption.label}` : content.category;
                })()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsViewMode(!isViewMode)}
              >
                {isViewMode ? <FileText className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isViewMode ? (
            // View Mode
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {content.created_at.toLocaleDateString()}</span>
                  </div>
                  {content.updated_at.getTime() !== content.created_at.getTime() && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {content.updated_at.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {content.content}
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., The Significance of Galungan Festival"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: UpdateEducationalContentInput) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category
                </Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: ContentCategory) =>
                    setFormData((prev: UpdateEducationalContentInput) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Content
                </Label>
                <Textarea
                  id="content"
                  placeholder="Write detailed information about this topic..."
                  value={formData.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: UpdateEducationalContentInput) => ({ ...prev, content: e.target.value }))
                  }
                  rows={15}
                  className="min-h-[300px] resize-none"
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.content?.length || 0} characters
                </p>
              </div>
            </form>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          
          {!isViewMode && (
            <Button
              type="submit"
              disabled={isLoading || !(formData.title?.trim()) || !(formData.content?.trim()) || !hasChanges}
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleSubmit}
            >
              {isLoading ? 'Updating...' : 'Update Content'}
            </Button>
          )}
          
          {isViewMode && (
            <Button
              type="button"
              onClick={() => setIsViewMode(false)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Edit Content
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}