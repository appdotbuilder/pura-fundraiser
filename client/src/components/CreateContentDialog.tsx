import { useState } from 'react';
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
import { BookOpen, FileText, Tag } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateEducationalContentInput, EducationalContent, ContentCategory } from '../../../server/src/schema';

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

interface CreateContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContentCreated: (content: EducationalContent) => void;
}

export function CreateContentDialog({ open, onOpenChange, onContentCreated }: CreateContentDialogProps) {
  const [formData, setFormData] = useState<CreateEducationalContentInput>({
    title: '',
    category: 'general',
    content: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const newContent = await trpc.createEducationalContent.mutate(formData);
      onContentCreated(newContent);
      
      // Reset form
      setFormData({
        title: '',
        category: 'general',
        content: ''
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create content:', error);
      // In a real app, you'd show an error message to the user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-800">
            <BookOpen className="h-5 w-5" />
            Create Educational Content
          </DialogTitle>
          <DialogDescription>
            Add a new article about Hindu Bali culture, traditions, or practices to educate visitors.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
                setFormData((prev: CreateEducationalContentInput) => ({ ...prev, title: e.target.value }))
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
              value={formData.category || 'general'} 
              onValueChange={(value: ContentCategory) =>
                setFormData((prev: CreateEducationalContentInput) => ({ ...prev, category: value }))
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
              placeholder="Write detailed information about this topic. Include historical context, cultural significance, practices, and any other relevant information..."
              value={formData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateEducationalContentInput) => ({ ...prev, content: e.target.value }))
              }
              rows={12}
              className="min-h-[200px] resize-none"
              required
            />
            <p className="text-xs text-gray-500">
              {formData.content.length} characters • Write comprehensive content for better search results
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.title || !formData.content}
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleSubmit}
          >
            {isLoading ? 'Creating...' : 'Create Content'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}