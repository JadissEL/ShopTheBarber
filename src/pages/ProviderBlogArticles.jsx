import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetaTags } from '@/components/seo/MetaTags';
import { Plus, FileText, Send, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_LABELS = {
  draft: { label: 'Draft', className: 'bg-amber-100 text-amber-800' },
  pending_review: { label: 'Pending review', className: 'bg-blue-100 text-blue-800' },
  published: { label: 'Published', className: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
};

export default function ProviderBlogArticles() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, role } = useAuth();
  const canWrite = ['barber', 'shop_owner', 'admin'].includes(role);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles-mine'],
    queryFn: () => sovereign.articles.mine(),
    enabled: isAuthenticated && canWrite,
  });

  const submitMutation = useMutation({
    mutationFn: (id) => sovereign.articles.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles-mine'] });
      toast.success('Article submitted for admin review');
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated || !canWrite) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <MetaTags title="My blog articles | Shop The Barber" />
        <p className="text-muted-foreground mb-4">Barbers and shop owners can publish blog articles here.</p>
        <Button onClick={() => navigate(createPageUrl('SignIn'))}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="stb-page lg:pb-8">
      <MetaTags title="My blog articles | Shop The Barber" />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Blog articles</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Write articles for the ShopTheBarber blog. An admin must approve before they go live.
            </p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('BlogArticleEditor'))}
            className="bg-primary text-white rounded-xl gap-2"
          >
            <Plus className="w-5 h-5" /> New article
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : articles.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No articles yet.</p>
              <Button onClick={() => navigate(createPageUrl('BlogArticleEditor'))}>Write your first article</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => {
              const status = STATUS_LABELS[article.status] || STATUS_LABELS.draft;
              const canEdit = article.status === 'draft' || article.status === 'rejected';
              const canSubmit = canEdit;
              return (
                <Card key={article.id} className="rounded-2xl">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-lg truncate">{article.title}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge className={`${status.className} border-0`}>{status.label}</Badge>
                        {article.category && (
                          <Badge variant="outline">{article.category}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Updated {article.updated_at ? format(new Date(article.updated_at), 'dd MMM yyyy') : '-'}
                        </span>
                      </div>
                      {article.status === 'rejected' && article.rejection_reason && (
                        <p className="text-sm text-red-600 mt-2">{article.rejection_reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {article.status === 'published' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={createPageUrl(`ArticleDetail?id=${article.id}`)}>View live</Link>
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(createPageUrl(`BlogArticleEditor?id=${article.id}`))}
                        >
                          <Pencil className="w-4 h-4 mr-1" /> Edit
                        </Button>
                      )}
                      {canSubmit && (
                        <Button
                          size="sm"
                          className="bg-primary text-white"
                          disabled={submitMutation.isPending}
                          onClick={() => submitMutation.mutate(article.id)}
                        >
                          <Send className="w-4 h-4 mr-1" /> Submit
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
