import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useCapabilityContext } from '@/hooks/useCapabilityContext';
import { hasCapability } from '@/lib/capabilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';
import { Save, Send, ImagePlus, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'tips', label: 'Tips' },
  { id: 'trends', label: 'Trends' },
  { id: 'products', label: 'Products' },
  { id: 'techniques', label: 'Techniques' },
  { id: 'lifestyle', label: 'Lifestyle' },
];

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function uploadImageFile(file) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Use PNG, JPG, WEBP, or GIF (max 5 MB).');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image too large (max 5 MB).');
  }
  const file_base64 = await fileToBase64(file);
  return sovereign.articles.uploadImage({
    file_name: file.name,
    file_base64,
    mime_type: file.type,
  });
}

export default function BlogArticleEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get('id');
  const queryClient = useQueryClient();
  const coverInputRef = useRef(null);
  const inlineInputRef = useRef(null);
  const contentRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const capabilityContext = useCapabilityContext();
  const canWrite = hasCapability(capabilityContext, 'article.write');

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'tips',
    image_url: '',
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);

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

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingCover(true);
    try {
      const { url } = await uploadImageFile(file);
      setForm((f) => ({ ...f, image_url: url }));
      toast.success('Cover image uploaded');
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleInlineUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingInline(true);
    try {
      const { url } = await uploadImageFile(file);
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      const snippet = `\n\n![${alt}](${url})\n\n`;
      setForm((f) => {
        const el = contentRef.current;
        if (el && typeof el.selectionStart === 'number') {
          const start = el.selectionStart;
          const end = el.selectionEnd;
          const next = f.content.slice(0, start) + snippet + f.content.slice(end);
          return { ...f, content: next };
        }
        return { ...f, content: `${f.content}${snippet}` };
      });
      toast.success('Image inserted into article');
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploadingInline(false);
    }
  };

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
        subtitle="Save a draft, then submit for review. An admin approves or sends it back with feedback — articles do not go live automatically."
        compact
        variant="light"
        tier="app"
      />
      <PageContent narrow>
        {existing?.status === 'rejected' && existing.rejection_reason && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              <span className="font-semibold">Sent back for changes: </span>
              {existing.rejection_reason}
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-4 border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
            <p><strong className="text-foreground">How publishing works</strong></p>
            <p>1. Write and save your draft (cover image and inline photos supported).</p>
            <p>2. Submit for review — status becomes &quot;Pending review&quot;.</p>
            <p>3. Admin approves → published on the blog, or rejects with a reason you can read and fix.</p>
          </CardContent>
        </Card>

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
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <Label htmlFor="content">Content (min. 100 characters to submit)</Label>
                <div className="flex gap-2">
                  <input
                    ref={inlineInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    className="hidden"
                    onChange={handleInlineUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={uploadingInline}
                    onClick={() => inlineInputRef.current?.click()}
                  >
                    {uploadingInline ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4" />
                    )}
                    Insert picture
                  </Button>
                </div>
              </div>
              <Textarea
                id="content"
                ref={contentRef}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Write your article… Use Insert picture to add photos in the body."
                className="mt-1 min-h-[240px] font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="image_url">Cover image</Label>
              <div className="mt-1 flex flex-col sm:flex-row gap-2">
                <Input
                  id="image_url"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="Paste a URL or upload a file"
                  className="flex-1"
                />
                <input
                  ref={coverInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  className="hidden"
                  onChange={handleCoverUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 shrink-0"
                  disabled={uploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {uploadingCover ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload
                </Button>
              </div>
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Cover preview"
                  className="mt-3 max-h-40 rounded-lg border object-cover"
                />
              )}
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
