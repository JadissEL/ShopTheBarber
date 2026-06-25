import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FolderPlus,
  Edit,
  Trash2,
  Plus,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function WishlistCollectionManager({ open, onOpenChange, collections, products }) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: '#3B82F6',
    is_public: false
  });

  const icons = ['📁', '❤️', '⭐', '🎁', '🛍️', '💎', '🔥', '✨', '🎯', '🏆'];
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', 
    '#10B981', '#EF4444', '#6366F1', '#14B8A6'
  ];

  const createCollectionMutation = useMutation({
    mutationFn: async (collectionData) => {
      const user = await sovereign.auth.me();
      return await sovereign.entities.WishlistCollection.create({
        ...collectionData,
        user_id: user.id,
        product_ids: [],
        order_index: collections.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-collections'] });
      setIsCreating(false);
      setNewCollection({
        name: '',
        description: '',
        icon: '📁',
        color: '#3B82F6',
        is_public: false
      });
    }
  });

  const updateCollectionMutation = useMutation({
    mutationFn: ({ id, data }) => sovereign.entities.WishlistCollection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-collections'] });
      setEditingCollection(null);
    }
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (id) => sovereign.entities.WishlistCollection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-collections'] });
    }
  });

  const handleCreate = () => {
    if (!newCollection.name.trim()) return;
    createCollectionMutation.mutate(newCollection);
  };

  const handleUpdate = (collection, updates) => {
    updateCollectionMutation.mutate({ 
      id: collection.id, 
      data: { ...collection, ...updates }
    });
  };

  const handleDelete = (id) => {
    if (confirm('Supprimer cette collection ? Les produits ne seront pas supprimés de votre wishlist.')) {
      deleteCollectionMutation.mutate(id);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(collections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    items.forEach((item, index) => {
      if (item.order_index !== index) {
        updateCollectionMutation.mutate({
          id: item.id,
          data: { ...item, order_index: index }
        });
      }
    });
  };

  const toggleProductInCollection = (collection, productId) => {
    const productIds = collection.product_ids || [];
    const newProductIds = productIds.includes(productId)
      ? productIds.filter(id => id !== productId)
      : [...productIds, productId];

    handleUpdate(collection, { product_ids: newProductIds });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <FolderPlus className="w-6 h-6 text-[#D08B3D]" />
            Gérer les Collections
          </DialogTitle>
          <DialogDescription>
            Organisez votre wishlist en collections thématiques
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Create New Collection */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="rounded-[12px] border-2 border-[#D08B3D] bg-[#D08B3D]/5">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">Nouvelle Collection</h4>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsCreating(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Nom *</Label>
                        <Input
                          value={newCollection.name}
                          onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                          placeholder="Ex: Produits de luxe"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newCollection.description}
                          onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                          placeholder="Description optionnelle..."
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label className="mb-3 block">Icône</Label>
                        <div className="flex gap-2 flex-wrap">
                          {icons.map((icon) => (
                            <button
                              key={icon}
                              onClick={() => setNewCollection({ ...newCollection, icon })}
                              className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all ${
                                newCollection.icon === icon
                                  ? 'bg-blue-600 scale-110'
                                  : 'bg-slate-100 hover:bg-slate-200'
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="mb-3 block">Couleur</Label>
                        <div className="flex gap-2">
                          {colors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setNewCollection({ ...newCollection, color })}
                              className={`w-10 h-10 rounded-full transition-all ${
                                newCollection.color === color ? 'ring-4 ring-offset-2 ring-blue-600' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleCreate}
                        disabled={!newCollection.name.trim() || createCollectionMutation.isPending}
                        className="w-full bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Créer la Collection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {!isCreating && (
            <Button
              onClick={() => setIsCreating(true)}
              variant="outline"
              className="w-full border-2 border-dashed border-slate-300 h-14 hover:border-[#D08B3D] hover:bg-[#D08B3D]/5 rounded-[10px]"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle Collection
            </Button>
          )}

          {/* Existing Collections */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="collections">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {collections.map((collection, index) => (
                    <Draggable
                      key={collection.id}
                      draggableId={collection.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Card className={`rounded-[12px] border-2 transition-all ${
                            snapshot.isDragging
                              ? 'border-[#D08B3D] shadow-2xl'
                              : 'border-slate-200'
                          }`}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                                    style={{ backgroundColor: collection.color + '20' }}
                                  >
                                    {collection.icon}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-lg">{collection.name}</h4>
                                    <p className="text-sm text-slate-600">{collection.description}</p>
                                    <Badge variant="outline" className="mt-2">
                                      {collection.product_ids?.length || 0} produit(s)
                                    </Badge>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setEditingCollection(
                                      editingCollection?.id === collection.id ? null : collection
                                    )}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(collection.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {editingCollection?.id === collection.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-4 pt-4 border-t border-slate-200"
                                >
                                  <Label className="mb-3 block font-semibold">
                                    Produits dans cette collection
                                  </Label>
                                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                                    {products.map((product) => (
                                      <button
                                        key={product.id}
                                        onClick={() => toggleProductInCollection(collection, product.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                                          collection.product_ids?.includes(product.id)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 hover:border-blue-300'
                                        }`}
                                      >
                                        {product.image_url ? (
                                          <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-12 h-12 rounded object-cover"
                                          />
                                        ) : (
                                          <div className="w-12 h-12 rounded bg-slate-100" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold truncate">
                                            {product.name}
                                          </p>
                                          <p className="text-xs text-slate-600">
                                            {product.price}€
                                          </p>
                                        </div>
                                        {collection.product_ids?.includes(product.id) && (
                                          <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {collections.length === 0 && !isCreating && (
            <div className="text-center py-12">
              <FolderPlus className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">
                Créez votre première collection pour mieux organiser votre wishlist
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}