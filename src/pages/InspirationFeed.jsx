import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Video, Award } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

export default function InspirationFeed() {
    const posts = [
        { id: 1, type: "image", title: "Classic Fade", author: "Alex Barber", likes: 234, image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800" },
        { id: 2, type: "video", title: "Fade Technique", author: "Pro Cuts", likes: 456, image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800" },
        { id: 3, type: "image", title: "Modern Style", author: "Urban Barber", likes: 189, image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800" }
    ];

    const categories = [
        { label: "All", value: "all" },
        { label: "Cuts", value: "cuts" },
        { label: "Beards", value: "beards" },
        { label: "Styles", value: "styles" },
        { label: "Tutorials", value: "tutorials" },
    ];

    return (
        <div className={stb.page}>
            <PageHeader
                tier="display"
                variant="dark"
                label="Discover"
                title="Style Inspiration"
                subtitle="Discover the latest trends and techniques"
            />
            <PageContent>
                <Tabs defaultValue="all" className="space-y-8">
                    <TabsList className="bg-muted rounded-lg p-1 w-full justify-start overflow-x-auto">
                        {categories.map((cat) => (
                            <TabsTrigger key={cat.value} value={cat.value} className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                {cat.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="all" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post, idx) => (
                            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                <Card className=" border border-border shadow-sm bg-card overflow-hidden group cursor-pointer hover:shadow-md transition-all">
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
                                        <h3 className="font-bold text-foreground mb-1">{post.title}</h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-muted-foreground">{post.author}</p>
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
            </PageContent>
        </div>
    );
}
