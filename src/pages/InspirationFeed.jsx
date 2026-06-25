import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Image as ImageIcon, Video, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function InspirationFeed() {
    const posts = [
        { id: 1, type: "image", title: "Fade Classique", author: "Alex Barber", likes: 234, image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800" },
        { id: 2, type: "video", title: "Technique de Dégradé", author: "Pro Cuts", likes: 456, image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800" },
        { id: 3, type: "image", title: "Style Moderne", author: "Urban Barber", likes: 189, image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800" }
    ];

    const categories = ["Tous", "Coupes", "Barbes", "Styles", "Tutoriels"];

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
                    <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Inspiration Coiffure</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Découvrez les dernières tendances et techniques</p>
                </motion.div>

                <Tabs defaultValue="all" className="space-y-8">
                    <TabsList className="bg-surface-light dark:bg-surface-dark rounded-xl p-1 w-full justify-start overflow-x-auto">
                        {categories.map(cat => (
                            <TabsTrigger key={cat} value={cat.toLowerCase()} className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                                {cat}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="tous" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post, idx) => (
                            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark overflow-hidden group cursor-pointer hover:shadow-soft-md transition-all">
                                    <div className="relative aspect-square overflow-hidden">
                                        <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                        <div className="absolute top-4 right-4">
                                            <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm">
                                                {post.type === 'video' ? <Video className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
                                                {post.type}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <h3 className="font-bold text-charcoal dark:text-white mb-1">{post.title}</h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-slate dark:text-matte-silver">{post.author}</p>
                                            <div className="flex items-center gap-1 text-primary">
                                                <Award className="w-4 h-4" />
                                                <span className="text-sm font-medium">{post.likes}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
