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
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

const STATUS_LABELS = {
  draft: { label: 'Draft', className: 'bg-warning/15 text-foreground' },
  pending_review: { label: 'Pending review', className: 'bg-primary/10 text-primary' },
  published: { label: 'Published', className: 'stb-chip stb-chip-active' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
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
    <div className={stb.page + ' lg:pb-8'}>
      <MetaTags title="My blog articles | Shop The Barber" />
      <PageHeader
        label="Provider"
        title="Blog articles"
        subtitle="Write articles for the ShopTheBarber blog. An admin must approve before they go live."
        compact
        variant="light"
        tier="app"
      >
        <Button
          onClick={() => navigate(createPageUrl('BlogArticleEditor'))}
          className="gap-2"
        >
          <Plus className="w-5 h-5" /> New article
        </Button>
      </PageHeader>
      <PageContent narrow>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : articles.length === 0 ? (
          <Card className="">
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
                <Card key={article.id} className="">
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
                        <p className="text-sm text-destructive mt-2">{article.rejection_reason}</p>
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
      </PageContent>
    </div>
  );
}
