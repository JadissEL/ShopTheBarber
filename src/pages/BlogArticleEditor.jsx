import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { canAccessProviderTools } from '@/lib/userRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';
import { Save, Send } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'tips', label: 'Tips' },
  { id: 'trends', label: 'Trends' },
  { id: 'products', label: 'Products' },
  { id: 'techniques', label: 'Techniques' },
  { id: 'lifestyle', label: 'Lifestyle' },
];

export default function BlogArticleEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get('id');
  const queryClient = useQueryClient();
  const { isAuthenticated, role } = useAuth();
  const canWrite = canAccessProviderTools(role);

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'tips',
    image_url: '',
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ['article-edit', articleId],
    queryFn: () => sovereign.articles.get(articleId),
    enabled: !!articleId && isAuthenticated && canWrite,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || '',
        excerpt: existing.excerpt || '',
        content: existing.content || '',
        category: existing.category || 'tips',
        image_url: existing.image_url || '',
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        image_url: form.image_url || undefined,
      };
      if (articleId) return sovereign.articles.update(articleId, payload);
      return sovereign.articles.create(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles-mine'] });
      toast.success('Article saved');
      if (!articleId && data?.id) {
        navigate(createPageUrl(`BlogArticleEditor?id=${data.id}`), { replace: true });
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      let id = articleId;
      if (!id) {
        const created = await sovereign.articles.create({
          title: form.title,
          excerpt: form.excerpt,
          content: form.content,
          category: form.category,
          image_url: form.image_url || undefined,
        });
        id = created.id;
      } else {
        await sovereign.articles.update(id, {
          title: form.title,
          excerpt: form.excerpt,
          content: form.content,
          category: form.category,
          image_url: form.image_url || undefined,
        });
      }
      return sovereign.articles.submit(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles-mine'] });
      toast.success('Submitted for admin review');
      navigate(createPageUrl('ProviderBlogArticles'));
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated || !canWrite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Sign in as a barber or shop owner to write articles.</p>
      </div>
    );
  }

  if (articleId && isLoading) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  if (existing && existing.status !== 'draft' && existing.status !== 'rejected') {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-muted-foreground mb-4">This article cannot be edited in its current state.</p>
        <Button onClick={() => navigate(createPageUrl('ProviderBlogArticles'))}>Back to articles</Button>
      </div>
    );
  }

  return (
    <div className={stb.page}>
      <MetaTags title={articleId ? 'Edit article' : 'New article'} />
      <PageHeader
        label="Provider"
        title={articleId ? 'Edit article' : 'New article'}
        subtitle="Draft content for the ShopTheBarber blog. Submit when ready for review."
        compact
        variant="light"
        tier="app"
      />
      <PageContent narrow>
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Article title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt (required for submission)</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Short summary for the blog listing"
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="content">Content (min. 100 characters to submit)</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Write your article…"
                className="mt-1 min-h-[240px]"
              />
            </div>

            <div>
              <Label htmlFor="image_url">Cover image URL (optional)</Label>
              <Input
                id="image_url"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="https://…"
                className="mt-1"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="outline"
                className="gap-2"
                disabled={saveMutation.isPending || !form.title.trim()}
                onClick={() => saveMutation.mutate()}
              >
                <Save className="w-4 h-4" /> Save draft
              </Button>
              <Button
                className="gap-2"
                disabled={submitMutation.isPending || !form.title.trim()}
                onClick={() => submitMutation.mutate()}
              >
                <Send className="w-4 h-4" /> Submit for review
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </div>
  );
}
