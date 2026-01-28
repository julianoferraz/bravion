import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  published_at: string;
  author_id: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();

  const selectedCategory = searchParams.get("category");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch published posts
    const { data: postsData } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_image_url, published_at, author_id, category_id")
      .eq("status", "published")
      .is("deleted_at", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (postsData) {
      setPosts(postsData);
    }

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from("blog_categories")
      .select("id, name, slug")
      .order("name");

    if (categoriesData) {
      setCategories(categoriesData);
    }

    setIsLoading(false);
  };

  // Filter posts by search and category
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory ||
      categories.find((c) => c.slug === selectedCategory)?.id === post.category_id;

    return matchesSearch && matchesCategory;
  });

  const estimateReadTime = (content: string | null) => {
    if (!content) return 3;
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find((c) => c.id === categoryId)?.name;
  };

  // Featured post (first post)
  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Hero Header - Astra Style */}
        <div className="bg-gradient-subtle border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight">
              {t.blog.title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.blog.subtitle}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Search & Filter Bar - Clean Astra Style */}
          <div className="flex flex-col md:flex-row gap-4 mb-12">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.blog.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base rounded-full border-border bg-card"
              />
            </div>
            
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSearchParams({})}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedCategory
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted border border-border"
                }`}
              >
                {t.blog.allCategories}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSearchParams({ category: category.slug })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted border border-border"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-8">
              {/* Featured Skeleton */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <Skeleton className="aspect-[16/10] rounded-2xl" />
                <div className="flex flex-col justify-center space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              {/* Grid Skeleton */}
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[16/10] rounded-xl" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{t.blog.noPosts}</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter</p>
            </div>
          ) : (
            <>
              {/* Featured Post - Large Card */}
              {featuredPost && (
                <Link to={`/blog/${featuredPost.slug}`} className="block mb-16 group">
                  <article className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-muted">
                      {featuredPost.cover_image_url ? (
                        <img
                          src={featuredPost.cover_image_url}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <span className="text-6xl opacity-50">📝</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {getCategoryName(featuredPost.category_id) && (
                        <Badge variant="secondary" className="text-xs font-medium">
                          {getCategoryName(featuredPost.category_id)}
                        </Badge>
                      )}
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                        {featuredPost.title}
                      </h2>
                      <p className="text-muted-foreground text-lg leading-relaxed line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(featuredPost.published_at), "MMMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {estimateReadTime(featuredPost.excerpt)} {t.blog.minRead}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                        {t.blog.readMore}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </article>
                </Link>
              )}

              {/* Posts Grid - Clean Astra Style */}
              {remainingPosts.length > 0 && (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {remainingPosts.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                      <article className="h-full flex flex-col">
                        {/* Image */}
                        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted mb-5">
                          {post.cover_image_url ? (
                            <img
                              src={post.cover_image_url}
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
                              <span className="text-4xl opacity-30">📝</span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col flex-1">
                          {/* Category & Date */}
                          <div className="flex items-center gap-3 mb-3 text-sm">
                            {getCategoryName(post.category_id) && (
                              <Badge variant="secondary" className="text-xs">
                                {getCategoryName(post.category_id)}
                              </Badge>
                            )}
                            <span className="text-muted-foreground">
                              {format(new Date(post.published_at), "MMM d, yyyy")}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-xl font-semibold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>

                          {/* Excerpt */}
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1 mb-4">
                            {post.excerpt}
                          </p>

                          {/* Read More */}
                          <div className="flex items-center gap-2 text-sm text-primary font-medium group-hover:gap-3 transition-all">
                            {t.blog.readMore}
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
