import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Star, MapPin, Clock, Eye, Heart, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Video {
  id: number;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  order_index: number;
}

interface Article {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  video_url?: string;
  status: string;
  categories?: string;
  created_at: string;
  published_at?: string;
  view_count: number;
  likes_count: number;
  first_name: string;
  last_name: string;
}

interface BarberProfileProps {
  barber: {
    id: number;
    name: string;
    salon_name: string;
    description?: string;
    rating: number;
    review_count: number;
    location: string;
    accepts_home: boolean;
    accepts_shop: boolean;
    image_url?: string;
    videos?: Video[];
    articles?: Article[];
  };
  onBookingClick: () => void;
}

export default function BarberProfile({ barber, onBookingClick }: BarberProfileProps) {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'videos' | 'articles'>('overview');

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEmbedUrl = (url: string) => {
    // Convert YouTube URL to embed URL
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const [selectedVideo, setSelectedVideo] = React.useState<Video | null>(null);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Barber Header */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <img
                src={barber.image_url || 'https://via.placeholder.com/200x200?text=Photo'}
                alt={barber.name}
                className="w-32 h-32 rounded-lg object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{barber.name}</h1>
                  <p className="text-gray-300 mb-2">{barber.salon_name}</p>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{barber.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-white font-medium">{barber.rating}</span>
                    <span className="text-gray-400">({barber.review_count} avis)</span>
                  </div>
                </div>
                <Button
                  onClick={onBookingClick}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  Réserver
                </Button>
              </div>
              
              {barber.description && (
                <p className="text-gray-300 mb-4">{barber.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2">
                {barber.accepts_shop && (
                  <Badge variant="secondary">Salon</Badge>
                )}
                {barber.accepts_home && (
                  <Badge variant="secondary">Domicile</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6">
        {[
          { id: 'overview', label: 'Aperçu', icon: Eye },
          { id: 'videos', label: 'Vidéos', icon: Clock },
          { id: 'articles', label: 'Articles', icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-amber-500 text-black"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Services */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Services Proposés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="h-16 w-16 text-gray-600 mx-auto mb-4 flex items-center justify-center">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    Services
                  </h3>
                  <p className="text-gray-500">
                    Consultez la liste des services proposés par ce barbier.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Avis */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Avis Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Star className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    Avis
                  </h3>
                  <p className="text-gray-500">
                    Découvrez les avis des clients sur ce barbier.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'videos' && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Vidéos de Présentation</CardTitle>
            </CardHeader>
            <CardContent>
              {!barber.videos || barber.videos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 text-gray-600 mx-auto mb-4 flex items-center justify-center">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    Aucune vidéo
                  </h3>
                  <p className="text-gray-500">
                    Ce barbier n'a pas encore ajouté de vidéos de présentation.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Video Player Modal */}
                  {selectedVideo && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-white">{selectedVideo.title}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedVideo(null)}
                            className="text-gray-400 hover:text-white"
                          >
                            ✕
                          </Button>
                        </div>
                        <div className="aspect-video">
                          <iframe
                            src={getEmbedUrl(selectedVideo.video_url)}
                            title={selectedVideo.title}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        {selectedVideo.description && (
                          <div className="p-4 border-t border-gray-700">
                            <p className="text-gray-300">{selectedVideo.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Video Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {barber.videos.map((video) => (
                      <div key={video.id} className="space-y-3">
                        <div className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden group cursor-pointer">
                          {video.thumbnail_url ? (
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                              <svg className="h-12 w-12 text-gray-400 group-hover:text-amber-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:text-amber-500 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3"
                              onClick={() => setSelectedVideo(video)}
                            >
                              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </Button>
                          </div>
                          {video.duration && (
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                              {formatDuration(video.duration)}
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-amber-500 text-black text-xs px-2 py-1 rounded font-medium">
                            #{video.order_index}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-1">{video.title}</h4>
                          {video.description && (
                            <p className="text-sm text-gray-400 line-clamp-2">{video.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'articles' && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Articles du Blog</CardTitle>
            </CardHeader>
            <CardContent>
              {!barber.articles || barber.articles.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    Aucun article
                  </h3>
                  <p className="text-gray-500">
                    Ce barbier n'a pas encore publié d'articles.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {barber.articles.map((article) => (
                    <div key={article.id} className="border-b border-gray-700 pb-6 last:border-b-0">
                      <div className="flex items-start space-x-4">
                        {article.featured_image && (
                          <img
                            src={article.featured_image}
                            alt={article.title}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {article.title}
                          </h3>
                          {article.excerpt && (
                            <p className="text-gray-300 mb-3">{article.excerpt}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {article.view_count} vues
                            </span>
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {article.likes_count} likes
                            </span>
                            {article.categories && (
                              <span className="text-blue-400">{article.categories}</span>
                            )}
                            <span>
                              Par {article.first_name} {article.last_name}
                            </span>
                          </div>
                          <div className="mt-3">
                            <Link
                              to={`/blog/article/${article.id}`}
                              className="text-amber-500 hover:text-amber-400 text-sm font-medium"
                            >
                              Lire l'article →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 