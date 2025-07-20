import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Trash2, Edit, Plus, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface Video {
  id: number;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  order_index: number;
  created_at: string;
}

interface BarberVideoManagerProps {
  barberId: number;
  videos: Video[];
  onVideosChange: () => void;
}

export default function BarberVideoManager({ barberId, videos, onVideosChange }: BarberVideoManagerProps) {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingVideo, setEditingVideo] = React.useState<Video | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: ''
  });

  const handleAddVideo = async () => {
    if (!formData.title || !formData.videoUrl) {
      alert('Le titre et l\'URL de la vidéo sont obligatoires');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/barber-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          barberId,
          title: formData.title,
          description: formData.description || null,
          videoUrl: formData.videoUrl,
          thumbnailUrl: formData.thumbnailUrl || null,
          duration: formData.duration ? parseInt(formData.duration) : null
        })
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        setFormData({ title: '', description: '', videoUrl: '', thumbnailUrl: '', duration: '' });
        onVideosChange();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'ajout de la vidéo');
      }
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Erreur lors de l\'ajout de la vidéo');
    } finally {
      setLoading(false);
    }
  };

  const handleEditVideo = async () => {
    if (!editingVideo || !formData.title || !formData.videoUrl) {
      alert('Le titre et l\'URL de la vidéo sont obligatoires');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/barber-videos/${editingVideo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          videoUrl: formData.videoUrl,
          thumbnailUrl: formData.thumbnailUrl || null,
          duration: formData.duration ? parseInt(formData.duration) : null,
          orderIndex: editingVideo.order_index
        })
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingVideo(null);
        setFormData({ title: '', description: '', videoUrl: '', thumbnailUrl: '', duration: '' });
        onVideosChange();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la modification de la vidéo');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      alert('Erreur lors de la modification de la vidéo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/barber-videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        onVideosChange();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la suppression de la vidéo');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Erreur lors de la suppression de la vidéo');
    }
  };

  const openEditDialog = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      videoUrl: video.video_url,
      thumbnailUrl: video.thumbnail_url || '',
      duration: video.duration ? video.duration.toString() : ''
    });
    setIsEditDialogOpen(true);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vidéos de Présentation</h3>
          <p className="text-sm text-gray-500">
            Ajoutez jusqu'à 3 vidéos pour présenter votre travail ({videos.length}/3)
          </p>
        </div>
        {videos.length < 3 && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une vidéo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une vidéo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Titre de la vidéo"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de la vidéo"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="videoUrl">URL de la vidéo *</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <Label htmlFor="thumbnailUrl">URL de la miniature</Label>
                  <Input
                    id="thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Durée (secondes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="120"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddVideo} disabled={loading}>
                    {loading ? 'Ajout...' : 'Ajouter'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {videos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="h-12 w-12 text-gray-400 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">Aucune vidéo ajoutée</p>
            <p className="text-sm text-gray-400">Ajoutez des vidéos pour présenter votre travail</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {videos.map((video) => (
            <Card key={video.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{video.title}</h4>
                      <Badge variant="secondary">#{video.order_index}</Badge>
                    </div>
                    {video.description && (
                      <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                    )}
                                         <div className="flex items-center space-x-4 text-sm text-gray-500">
                       <span className="flex items-center">
                         <div className="h-3 w-3 mr-1">
                           <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                         </div>
                         {video.video_url}
                       </span>
                      {video.duration && (
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(video.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(video)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteVideo(video.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la vidéo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Titre *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de la vidéo"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la vidéo"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-videoUrl">URL de la vidéo *</Label>
              <Input
                id="edit-videoUrl"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <Label htmlFor="edit-thumbnailUrl">URL de la miniature</Label>
              <Input
                id="edit-thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
            <div>
              <Label htmlFor="edit-duration">Durée (secondes)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="120"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleEditVideo} disabled={loading}>
                {loading ? 'Modification...' : 'Modifier'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 