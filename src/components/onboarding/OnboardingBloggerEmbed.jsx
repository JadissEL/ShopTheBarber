import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { invalidateOnboardingQueries } from '@/lib/bootstrapProvider';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

const profileSchema = z.object({
  pen_name: z.string().min(2, 'Pen name must be at least 2 characters'),
  bio: z.string().min(20, 'Bio must be at least 20 characters'),
});

const articleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  excerpt: z.string().min(10, 'Excerpt must be at least 10 characters'),
  content: z.string().min(40, 'Write at least a few sentences for your first draft'),
  category: z.string(),
});

const CATEGORIES = [
  { id: 'tips', label: 'Tips' },
  { id: 'trends', label: 'Trends' },
  { id: 'products', label: 'Products' },
  { id: 'techniques', label: 'Techniques' },
  { id: 'lifestyle', label: 'Lifestyle' },
];

export function OnboardingBloggerEmbed({ stepId, onSaved }) {
  const queryClient = useQueryClient();
  const { authorProfile, articles } = useOnboardingProgress();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      pen_name: authorProfile?.pen_name || '',
      bio: authorProfile?.bio || '',
    },
  });

  const articleForm = useForm({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      category: 'tips',
    },
  });

  useEffect(() => {
    profileForm.reset({
      pen_name: authorProfile?.pen_name || '',
      bio: authorProfile?.bio || '',
    });
  }, [authorProfile?.pen_name, authorProfile?.bio, profileForm]);

  const saveProfileMutation = useMutation({
    mutationFn: (data) =>
      sovereign.onboarding.updateAuthorProfile({
        pen_name: data.pen_name.trim(),
        bio: data.bio.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-author-profile'] });
      invalidateOnboardingQueries(queryClient);
      toast.success('Author profile saved');
      onSaved?.();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save profile'),
  });

  const createArticleMutation = useMutation({
    mutationFn: (data) =>
      sovereign.articles.create({
        title: data.title.trim(),
        excerpt: data.excerpt.trim(),
        content: data.content.trim(),
        category: data.category,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-articles'] });
      toast.success('Article draft saved');
      onSaved?.();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save article'),
  });

  if (stepId === 'profile') {
    return (
      <Card>
        <CardContent className="p-6">
          <form
            className="space-y-4 max-w-lg"
            onSubmit={profileForm.handleSubmit((data) => saveProfileMutation.mutate(data))}
          >
            <div className="space-y-2">
              <Label htmlFor="author-pen-name">Pen name / byline</Label>
              <Input id="author-pen-name" {...profileForm.register('pen_name')} placeholder="Your public name" />
              {profileForm.formState.errors.pen_name && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.pen_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="author-bio">Bio</Label>
              <Textarea
                id="author-bio"
                rows={4}
                {...profileForm.register('bio')}
                placeholder="Your niche, experience, and what readers can expect from your articles."
              />
              {profileForm.formState.errors.bio && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.bio.message}</p>
              )}
            </div>
            <Button type="submit" disabled={saveProfileMutation.isPending}>
              {saveProfileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save author profile
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (stepId === 'article') {
    if (articles.length > 0) {
      return (
        <Card>
          <CardContent className="p-6 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="font-semibold">You have {articles.length} article draft{articles.length === 1 ? '' : 's'}</p>
              <p className="text-sm text-muted-foreground">Submit for review from your blogger dashboard when ready.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-6">
          <form
            className="space-y-4 max-w-lg"
            onSubmit={articleForm.handleSubmit((data) => createArticleMutation.mutate(data))}
          >
            <div className="space-y-2">
              <Label htmlFor="article-title">Title</Label>
              <Input id="article-title" {...articleForm.register('title')} placeholder="Your first story headline" />
              {articleForm.formState.errors.title && (
                <p className="text-sm text-destructive">{articleForm.formState.errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-excerpt">Excerpt</Label>
              <Textarea id="article-excerpt" rows={2} {...articleForm.register('excerpt')} placeholder="Short teaser for readers" />
              {articleForm.formState.errors.excerpt && (
                <p className="text-sm text-destructive">{articleForm.formState.errors.excerpt.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-content">Body</Label>
              <Textarea
                id="article-content"
                rows={6}
                {...articleForm.register('content')}
                placeholder="Write your article — tips, trends, or product reviews work great for a first post."
              />
              {articleForm.formState.errors.content && (
                <p className="text-sm text-destructive">{articleForm.formState.errors.content.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={articleForm.watch('category')}
                onValueChange={(value) => articleForm.setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={createArticleMutation.isPending}>
              {createArticleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save article draft
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return null;
}
