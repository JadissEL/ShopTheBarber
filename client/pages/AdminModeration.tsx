import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { 
  Eye, 
  CheckCircle, 
  X, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  User,
  Star
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ContentItem {
  id: number;
  content_type: 'article' | 'video';
  title: string;
  author: string;
  created_date: string;
  status?: string;
  excerpt?: string;
  categories?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
}

interface ModerationResponse {
  content: ContentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminModeration() {
  const { user } = useAuth();
  const [content, setContent] = React.useState<ContentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedType, setSelectedType] = React.useState('all');
  const [selectedStatus, setSelectedStatus] = React.useState('pending_review');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  // Dialog states
  const [moderationDialog, setModerationDialog] = React.useState(false);
  const [selectedContent, setSelectedContent] = React.useState<ContentItem | null>(null);
  const [moderationAction, setModerationAction] = React.useState<'approve' | 'reject' | 'delete'>('approve');
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [moderating, setModerating] = React.useState(false);
  const [globalError, setGlobalError] = React.useState<string | null>(null);

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Nouvelle fonction pour charger les contenus à modérer
  const loadContent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let articles: ContentItem[] = [];
      let videos: ContentItem[] = [];
      let reviews: ContentItem[] = [];

      // Articles
      if (selectedType === 'all' || selectedType === 'articles') {
        const res = await fetch(`http://localhost:3001/api/admin/blog-articles?status=${selectedStatus}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          articles = data.map((a: any) => ({
            id: a.id,
            content_type: 'article',
            title: a.title,
            author: a.author_id ? `Auteur #${a.author_id}` : 'Inconnu',
            created_date: a.created_at,
            status: a.status,
            excerpt: a.excerpt,
            categories: a.categories
          }));
        }
      }
      // Vidéos
      if (selectedType === 'all' || selectedType === 'videos') {
        const res = await fetch(`http://localhost:3001/api/admin/barber-videos?status=${selectedStatus === 'pending_review' ? 'pending' : selectedStatus}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          videos = data.map((v: any) => ({
            id: v.id,
            content_type: 'video',
            title: v.title,
            author: v.barber_id ? `Barbier #${v.barber_id}` : 'Inconnu',
            created_date: v.created_at,
            status: v.status || (v.is_active ? 'published' : 'pending_review'),
            video_url: v.video_url,
            thumbnail_url: v.thumbnail_url,
            duration: v.duration
          }));
        }
      }
      setContent([...articles, ...videos]);
      setPagination({ page: 1, limit: 100, total: articles.length + videos.length, pages: 1 });
    } catch (error) {
      console.error('Erreur lors du chargement du contenu', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadContent();
  }, [selectedType, selectedStatus, currentPage]);

  // Nouvelle fonction pour modérer
  const handleModeration = async () => {
    if (!selectedContent) return;
    setModerating(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let method = 'PUT';
      if (selectedContent.content_type === 'article') {
        if (moderationAction === 'approve') endpoint = `/api/admin/blog-articles/${selectedContent.id}/approve`;
        else if (moderationAction === 'reject') endpoint = `/api/admin/blog-articles/${selectedContent.id}/reject`;
        else if (moderationAction === 'delete') { endpoint = `/api/admin/blog-articles/${selectedContent.id}`; method = 'DELETE'; }
      } else if (selectedContent.content_type === 'video') {
        if (moderationAction === 'approve') endpoint = `/api/admin/barber-videos/${selectedContent.id}/approve`;
        else if (moderationAction === 'reject') endpoint = `/api/admin/barber-videos/${selectedContent.id}/reject`;
        else if (moderationAction === 'delete') { endpoint = `/api/admin/barber-videos/${selectedContent.id}`; method = 'DELETE'; }
      }
      if (!endpoint) return;
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        loadContent();
        setModerationDialog(false);
        setSelectedContent(null);
        setRejectionReason('');
      } else {
        console.error('Erreur lors de la modération');
      }
    } catch (error) {
      console.error('Erreur lors de la modération', error);
    } finally {
      setModerating(false);
    }
  };

  // Open moderation dialog
  const openModerationDialog = (content: ContentItem, action: 'approve' | 'reject' | 'delete') => {
    setSelectedContent(content);
    setModerationAction(action);
    setModerationDialog(true);
  };

  // Filter content based on search term
  const filteredContent = content.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <div className="px-3 py-1 bg-gradient-to-r from-moroccan-gold/20 to-moroccan-copper/20 text-moroccan-gold border border-moroccan-gold/30 rounded-full text-xs font-bold">En attente</div>;
      case 'published':
        return <div className="px-3 py-1 bg-gradient-to-r from-moroccan-green/20 to-moroccan-gold/20 text-moroccan-green border border-moroccan-green/30 rounded-full text-xs font-bold">Publié</div>;
      case 'rejected':
        return <div className="px-3 py-1 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold">Rejeté</div>;
      default:
        return <div className="px-3 py-1 bg-gradient-to-r from-moroccan-darkgrey/20 to-moroccan-charcoal/20 text-moroccan-offwhite/60 border border-moroccan-gold/20 rounded-full text-xs font-bold">{status}</div>;
    }
  };

  const getContentIcon = (type: string) => {
    return type === 'article' ? <span className="text-2xl">📄</span> : <span className="text-2xl">🎥</span>;
  };

  try {
    if (globalError) {
      return (
        <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
          <b>Erreur dans la page de modération :</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{globalError}</pre>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-moroccan-charcoal via-moroccan-darkgrey to-moroccan-charcoal relative overflow-hidden">
        {/* Moroccan Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="moroccan-pattern"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-moroccan-gold to-moroccan-copper rounded-full mb-6 shadow-moroccan-xl">
              <span className="text-3xl">🛡️</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading text-moroccan-offwhite mb-4">
              Modération de Contenu
            </h1>
            <p className="text-xl text-moroccan-offwhite/70 max-w-2xl mx-auto">
              Gérez et modérez le contenu soumis par les utilisateurs avec notre interface premium
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-moroccan-gold/10 to-moroccan-copper/10 border-moroccan-gold/30 shadow-moroccan-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-moroccan-gold to-moroccan-copper rounded-lg flex items-center justify-center mx-auto mb-4 shadow-moroccan">
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="text-2xl font-heading text-moroccan-offwhite mb-2">
                  {content.filter(c => c.content_type === 'article').length}
                </h3>
                <p className="text-moroccan-offwhite/60">Articles</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-moroccan-green/10 to-moroccan-gold/10 border-moroccan-green/30 shadow-moroccan-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-moroccan-green to-moroccan-gold rounded-lg flex items-center justify-center mx-auto mb-4 shadow-moroccan">
                  <span className="text-2xl">🎥</span>
                </div>
                <h3 className="text-2xl font-heading text-moroccan-offwhite mb-2">
                  {content.filter(c => c.content_type === 'video').length}
                </h3>
                <p className="text-moroccan-offwhite/60">Vidéos</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-moroccan-royal-blue/10 to-moroccan-green/10 border-moroccan-royal-blue/30 shadow-moroccan-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-moroccan-royal-blue to-moroccan-green rounded-lg flex items-center justify-center mx-auto mb-4 shadow-moroccan">
                  <CheckCircle className="h-6 w-6 text-moroccan-charcoal" />
                </div>
                <h3 className="text-2xl font-heading text-moroccan-offwhite mb-2">
                  {content.filter(c => c.status === 'published').length}
                </h3>
                <p className="text-moroccan-offwhite/60">Approuvés</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-moroccan-gold/10 to-moroccan-copper/10 border-moroccan-gold/30 shadow-moroccan-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-moroccan-gold to-moroccan-copper rounded-lg flex items-center justify-center mx-auto mb-4 shadow-moroccan">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-2xl font-heading text-moroccan-offwhite mb-2">
                  {content.filter(c => c.status === 'pending_review').length}
                </h3>
                <p className="text-moroccan-offwhite/60">En attente</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-8 bg-gradient-to-br from-moroccan-darkgrey/50 to-moroccan-charcoal/50 border-moroccan-gold/20 shadow-moroccan-xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-heading text-moroccan-offwhite mb-3">
                    Type de contenu
                  </label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="bg-gradient-to-r from-moroccan-darkgrey/50 to-moroccan-charcoal/50 border-moroccan-gold/30 text-moroccan-offwhite hover:border-moroccan-gold/50 transition-all duration-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-moroccan-charcoal border-moroccan-gold/30">
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="articles">Articles</SelectItem>
                      <SelectItem value="videos">Vidéos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-heading text-moroccan-offwhite mb-3">
                    Statut
                  </label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="bg-gradient-to-r from-moroccan-darkgrey/50 to-moroccan-charcoal/50 border-moroccan-gold/30 text-moroccan-offwhite hover:border-moroccan-gold/50 transition-all duration-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-moroccan-charcoal border-moroccan-gold/30">
                      <SelectItem value="pending_review">En attente</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-heading text-moroccan-offwhite mb-3">
                    Rechercher
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-moroccan-gold" />
                    <Input
                      placeholder="Titre ou auteur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gradient-to-r from-moroccan-darkgrey/50 to-moroccan-charcoal/50 border-moroccan-gold/30 text-moroccan-offwhite placeholder:text-moroccan-offwhite/50 hover:border-moroccan-gold/50 focus:border-moroccan-gold transition-all duration-300"
                    />
                  </div>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedType('all');
                      setSelectedStatus('pending_review');
                      setCurrentPage(1);
                    }}
                    variant="outline"
                    className="w-full bg-gradient-to-r from-moroccan-gold/10 to-moroccan-copper/10 border-moroccan-gold/30 text-moroccan-gold hover:from-moroccan-gold/20 hover:to-moroccan-copper/20 hover:border-moroccan-gold/50 transition-all duration-300 shadow-moroccan"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content List */}
          {loading ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-moroccan-gold/20 border-t-moroccan-gold rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-moroccan-green rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s' }}></div>
              </div>
              <p className="mt-6 text-moroccan-offwhite/70 font-medium">Chargement du contenu...</p>
            </div>
          ) : filteredContent.length > 0 ? (
            <div className="space-y-6">
              {filteredContent.map((item, index) => (
                <Card 
                  key={`${item.content_type}-${item.id}`} 
                  className="group relative bg-gradient-to-r from-moroccan-darkgrey/50 to-moroccan-charcoal/50 border-moroccan-gold/20 shadow-moroccan-lg hover:shadow-moroccan-xl transition-all duration-500 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Moroccan Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5 rounded-xl overflow-hidden">
                    <div className="moroccan-pattern"></div>
                  </div>
                  
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="p-3 bg-gradient-to-br from-moroccan-gold/20 to-moroccan-copper/20 rounded-lg">
                            {getContentIcon(item.content_type)}
                          </div>
                          <div>
                            <h3 className="text-xl font-heading text-moroccan-offwhite mb-2">{item.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-moroccan-offwhite/60">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-moroccan-gold" />
                                <span>{item.author}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-moroccan-gold" />
                                <span>{formatDate(item.created_date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {item.excerpt && (
                          <p className="text-moroccan-offwhite/80 text-sm mb-4 leading-relaxed">
                            {item.excerpt}
                          </p>
                        )}
                        
                        {item.categories && (
                          <div className="flex items-center space-x-3 mb-4">
                            <span className="text-sm text-moroccan-offwhite/60 font-medium">Catégories:</span>
                            {item.categories.split(',').map((category, index) => (
                              <div key={index} className="px-3 py-1 bg-gradient-to-r from-moroccan-gold/10 to-moroccan-copper/10 border border-moroccan-gold/30 rounded-full text-xs text-moroccan-gold font-bold">
                                {category.trim()}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {item.status && getStatusBadge(item.status)}
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-6">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModerationDialog(item, 'approve')}
                          className="bg-gradient-to-r from-moroccan-green/10 to-moroccan-gold/10 border-moroccan-green/30 text-moroccan-green hover:from-moroccan-green/20 hover:to-moroccan-gold/20 hover:border-moroccan-green/50 transition-all duration-300 shadow-moroccan"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModerationDialog(item, 'reject')}
                          className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30 text-red-400 hover:from-red-500/20 hover:to-red-600/20 hover:border-red-500/50 transition-all duration-300 shadow-moroccan"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModerationDialog(item, 'delete')}
                          className="bg-gradient-to-r from-moroccan-darkgrey/20 to-moroccan-charcoal/20 border-moroccan-gold/20 text-moroccan-offwhite/60 hover:from-moroccan-darkgrey/30 hover:to-moroccan-charcoal/30 hover:border-moroccan-gold/30 hover:text-moroccan-offwhite transition-all duration-300 shadow-moroccan"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-moroccan-darkgrey/50 to-moroccan-charcoal/50 border-moroccan-gold/20 shadow-moroccan-xl">
              <CardContent className="p-16 text-center">
                                 <div className="relative mb-8">
                   <div className="w-20 h-20 bg-gradient-to-br from-moroccan-gold/20 to-moroccan-copper/20 rounded-full flex items-center justify-center mx-auto">
                     <span className="text-4xl">⚠️</span>
                   </div>
                   <div className="absolute -top-2 -right-2 w-8 h-8 bg-moroccan-pattern opacity-20"></div>
                 </div>
                <h3 className="text-2xl font-heading text-moroccan-offwhite mb-4">Aucun contenu à modérer</h3>
                <p className="text-moroccan-offwhite/60 text-lg">
                  {selectedStatus === 'pending_review' 
                    ? 'Aucun contenu en attente de modération'
                    : 'Aucun contenu trouvé avec les filtres actuels'
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center space-x-3 mt-12">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-gradient-to-r from-moroccan-gold/10 to-moroccan-copper/10 border-moroccan-gold/30 text-moroccan-gold hover:from-moroccan-gold/20 hover:to-moroccan-copper/20 hover:border-moroccan-gold/50 transition-all duration-300 shadow-moroccan"
              >
                Précédent
              </Button>
              
              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page 
                        ? "bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal shadow-moroccan-xl" 
                        : "bg-gradient-to-r from-moroccan-gold/10 to-moroccan-copper/10 border-moroccan-gold/30 text-moroccan-gold hover:from-moroccan-gold/20 hover:to-moroccan-copper/20 hover:border-moroccan-gold/50 transition-all duration-300 shadow-moroccan"
                      }
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                disabled={currentPage === pagination.pages}
                className="bg-gradient-to-r from-moroccan-gold/10 to-moroccan-copper/10 border-moroccan-gold/30 text-moroccan-gold hover:from-moroccan-gold/20 hover:to-moroccan-copper/20 hover:border-moroccan-gold/50 transition-all duration-300 shadow-moroccan"
              >
                Suivant
              </Button>
            </div>
          )}

          {/* Moderation Dialog */}
          <Dialog open={moderationDialog} onOpenChange={setModerationDialog}>
            <DialogContent className="bg-gradient-to-br from-moroccan-charcoal via-moroccan-darkgrey to-moroccan-charcoal border-moroccan-gold/20 shadow-moroccan-xl">
              <DialogHeader>
                <DialogTitle className="text-moroccan-offwhite font-heading text-xl">
                  {moderationAction === 'approve' && 'Approuver le contenu'}
                  {moderationAction === 'reject' && 'Rejeter le contenu'}
                  {moderationAction === 'delete' && 'Supprimer le contenu'}
                </DialogTitle>
                <DialogDescription className="text-moroccan-offwhite/70">
                  {selectedContent && (
                    <>
                      <strong className="text-moroccan-gold">{selectedContent.title}</strong> par {selectedContent.author}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              {moderationAction === 'reject' && (
                <div className="space-y-3">
                  <label className="text-sm font-heading text-moroccan-offwhite">
                    Raison du rejet (optionnel)
                  </label>
                  <Textarea
                    placeholder="Expliquez pourquoi ce contenu est rejeté..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="bg-gradient-to-r from-moroccan-darkgrey/50 to-moroccan-charcoal/50 border-moroccan-gold/30 text-moroccan-offwhite placeholder:text-moroccan-offwhite/50 hover:border-moroccan-gold/50 focus:border-moroccan-gold transition-all duration-300"
                    rows={3}
                  />
                </div>
              )}
              
              {moderationAction === 'delete' && (
                                 <div className="p-6 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl">
                   <div className="flex items-center space-x-3">
                     <span className="text-2xl">⚠️</span>
                     <span className="text-red-400 font-heading font-bold">Attention</span>
                   </div>
                   <p className="text-red-300 text-sm mt-3 leading-relaxed">
                     Cette action est irréversible. Le contenu sera définitivement supprimé.
                   </p>
                 </div>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setModerationDialog(false)}
                  disabled={moderating}
                  className="bg-gradient-to-r from-moroccan-darkgrey/20 to-moroccan-charcoal/20 border-moroccan-gold/20 text-moroccan-offwhite/60 hover:from-moroccan-darkgrey/30 hover:to-moroccan-charcoal/30 hover:border-moroccan-gold/30 hover:text-moroccan-offwhite transition-all duration-300"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleModeration}
                  disabled={moderating}
                  className={
                    moderationAction === 'approve' ? 'bg-gradient-to-r from-moroccan-green to-moroccan-gold hover:from-moroccan-green/90 hover:to-moroccan-gold/90 text-moroccan-charcoal shadow-moroccan-xl' :
                    moderationAction === 'reject' ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-500/90 hover:to-red-600/90 text-white shadow-moroccan-xl' :
                    'bg-gradient-to-r from-moroccan-darkgrey to-moroccan-charcoal hover:from-moroccan-darkgrey/90 hover:to-moroccan-charcoal/90 text-moroccan-offwhite shadow-moroccan-xl'
                  }
                >
                  {moderating ? 'Modération...' : (
                    <>
                      {moderationAction === 'approve' && <CheckCircle className="h-4 w-4 mr-2" />}
                      {moderationAction === 'reject' && <X className="h-4 w-4 mr-2" />}
                      {moderationAction === 'delete' && <Trash2 className="h-4 w-4 mr-2" />}
                      {moderationAction === 'approve' && 'Approuver'}
                      {moderationAction === 'reject' && 'Rejeter'}
                      {moderationAction === 'delete' && 'Supprimer'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  } catch (err: any) {
    setGlobalError(err?.message || String(err));
    return (
      <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
        <b>Erreur dans la page de modération (render) :</b>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err?.message || String(err)}</pre>
      </div>
    );
  }
} 