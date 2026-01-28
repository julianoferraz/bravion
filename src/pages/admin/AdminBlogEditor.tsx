import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";
import RichTextEditor from "@/components/blog/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Send,
  Sparkles,
  Image,
  Calendar,
  Loader2,
  Upload,
  Eye,
  FolderOpen,
} from "lucide-react";
import { format } from "date-fns";

type PostStatus = "draft" | "generating" | "ready" | "scheduled" | "published" | "failed" | "archived" | "deleted";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  brief: string | null;
  excerpt: string | null;
  content_html: string | null;
  status: PostStatus;
  author_id: string | null;
  category_id: string | null;
  cover_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  ai_tone: string | null;
  ai_length: string | null;
  ai_target_audience: string | null;
  ai_keywords: string[] | null;
  ai_language: string | null;
}

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { user, canManageBlog, isAdmin, isEditor, session } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [brief, setBrief] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState<PostStatus>("draft");

  // AI settings
  const [aiTone, setAiTone] = useState("professional");
  const [aiLength, setAiLength] = useState("medium");
  const [aiTargetAudience, setAiTargetAudience] = useState("");
  const [aiKeywords, setAiKeywords] = useState("");
  const [imageTheme, setImageTheme] = useState("");
  const [imageStyle, setImageStyle] = useState("modern illustration");

  useEffect(() => {
    if (!canManageBlog) {
      navigate("/login");
      return;
    }

    fetchCategories();
    if (!isNew && id) {
      fetchPost(id);
    }
  }, [id, canManageBlog]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("blog_categories")
      .select("*")
      .order("name");

    if (data) {
      setCategories(data);
    }
  };

  const fetchPost = async (postId: string) => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Post not found",
        variant: "destructive",
      });
      navigate("/admin/blog");
      return;
    }

    setTitle(data.title);
    setSlug(data.slug);
    setBrief(data.brief || "");
    setExcerpt(data.excerpt || "");
    setContentHtml(data.content_html || "");
    setCategoryId(data.category_id);
    setCoverImageUrl(data.cover_image_url);
    setMetaTitle(data.meta_title || "");
    setMetaDescription(data.meta_description || "");
    setStatus(data.status);
    setScheduledAt(data.scheduled_at ? format(new Date(data.scheduled_at), "yyyy-MM-dd'T'HH:mm") : "");
    setAiTone(data.ai_tone || "professional");
    setAiLength(data.ai_length || "medium");
    setAiTargetAudience(data.ai_target_audience || "");
    setAiKeywords(data.ai_keywords?.join(", ") || "");

    setIsLoading(false);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (isNew || status === "draft") {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSave = async (newStatus?: PostStatus) => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const postData = {
      title,
      slug: slug || generateSlug(title),
      brief,
      excerpt,
      content_html: contentHtml,
      category_id: categoryId,
      cover_image_url: coverImageUrl,
      meta_title: metaTitle || title,
      meta_description: metaDescription || excerpt,
      status: newStatus || status,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      published_at: newStatus === "published" ? new Date().toISOString() : null,
      ai_tone: aiTone,
      ai_length: aiLength,
      ai_target_audience: aiTargetAudience,
      ai_keywords: aiKeywords.split(",").map((k) => k.trim()).filter(Boolean),
      ai_language: language === "pt" ? "pt-BR" : "en",
    };

    let result;

    if (isNew) {
      result = await supabase
        .from("blog_posts")
        .insert({ ...postData, author_id: user?.id })
        .select()
        .single();
    } else {
      result = await supabase
        .from("blog_posts")
        .update(postData)
        .eq("id", id)
        .select()
        .single();
    }

    if (result.error) {
      toast({
        title: "Error",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Saved successfully!" });
      if (isNew && result.data) {
        navigate(`/admin/blog/${result.data.id}`);
      } else {
        setStatus(newStatus || status);
      }
    }

    setIsSaving(false);
  };

  const handleGenerateText = async () => {
    if (!title.trim() || !brief.trim()) {
      toast({
        title: "Error",
        description: "Title and Brief are required for AI generation",
        variant: "destructive",
      });
      return;
    }

    // Save first if new
    if (isNew) {
      await handleSave();
      return;
    }

    setIsGeneratingText(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-text", {
        body: {
          postId: id,
          title,
          brief,
          tone: aiTone,
          length: aiLength,
          targetAudience: aiTargetAudience,
          keywords: aiKeywords.split(",").map((k) => k.trim()).filter(Boolean),
          language: language === "pt" ? "pt-BR" : "en",
        },
      });

      if (error) throw error;

      if (data?.data) {
        const generated = data.data;
        setTitle(generated.refinedTitle || title);
        setSlug(generated.suggestedSlug || slug);
        setExcerpt(generated.excerpt || excerpt);
        setContentHtml(generated.contentHtml || contentHtml);
        setMetaTitle(generated.metaTitle || metaTitle);
        setMetaDescription(generated.metaDescription || metaDescription);
        setStatus("ready");

        toast({ title: "Content generated successfully!" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    }

    setIsGeneratingText(false);
  };

  const handleGenerateImage = async () => {
    if (isNew) {
      toast({
        title: "Error",
        description: "Save the post first",
        variant: "destructive",
      });
      return;
    }

    if (!imageTheme.trim()) {
      toast({
        title: "Error",
        description: "Please describe the image theme",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          postId: id,
          theme: imageTheme || title,
          style: imageStyle,
          aspectRatio: "16:9",
        },
      });

      if (error) throw error;

      if (data?.data?.imageUrl) {
        setCoverImageUrl(data.data.imageUrl);
        toast({ title: "Image generated successfully!" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    }

    setIsGeneratingImage(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isNew) {
      toast({
        title: "Error",
        description: "Save the post first",
        variant: "destructive",
      });
      return;
    }

    const fileName = `covers/${id}-${Date.now()}.${file.name.split(".").pop()}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return;
    }

    const { data: urlData } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    setCoverImageUrl(urlData.publicUrl);
    toast({ title: "Image uploaded!" });
  };

  const handleSchedule = async () => {
    if (!scheduledAt) {
      toast({
        title: "Error",
        description: "Select a date and time for scheduling",
        variant: "destructive",
      });
      return;
    }

    if (!contentHtml?.trim()) {
      toast({
        title: "Error",
        description: "Content is required for scheduling",
        variant: "destructive",
      });
      return;
    }

    await handleSave("scheduled");
  };

  if (!canManageBlog) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 max-w-5xl mx-auto px-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin/blog">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isNew ? t.admin.newPost : t.admin.editPost}
              </h1>
              {!isNew && (
                <Badge className={`mt-1 ${
                  status === "published" ? "bg-green-500/20 text-green-500" :
                  status === "scheduled" ? "bg-purple-500/20 text-purple-500" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {t.admin.statuses[status]}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleSave()} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline ml-2">{t.admin.saveDraft}</span>
            </Button>
            {(isAdmin || isEditor) && status !== "published" && (
              <Button onClick={() => handleSave("published")} disabled={isSaving}>
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">{t.admin.publish}</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="title">{t.admin.title} *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Post title..."
                    className="text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">{t.admin.slug}</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="post-url-slug"
                  />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="content">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">{t.admin.content}</TabsTrigger>
                <TabsTrigger value="ai">AI Generation</TabsTrigger>
                <TabsTrigger value="seo">{t.admin.seo}</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label htmlFor="excerpt">{t.admin.excerpt}</Label>
                      <Textarea
                        id="excerpt"
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder="Brief summary of the post..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">{t.admin.content}</Label>
                      <RichTextEditor
                        value={contentHtml}
                        onChange={setContentHtml}
                        placeholder="Start writing your post..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {t.admin.aiSettings}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="brief">{t.admin.brief} *</Label>
                      <Textarea
                        id="brief"
                        value={brief}
                        onChange={(e) => setBrief(e.target.value)}
                        placeholder="Describe what the article should be about..."
                        rows={4}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>{t.admin.tone}</Label>
                        <Select value={aiTone} onValueChange={setAiTone}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="neutral">{t.admin.tones.neutral}</SelectItem>
                            <SelectItem value="informal">{t.admin.tones.informal}</SelectItem>
                            <SelectItem value="professional">{t.admin.tones.professional}</SelectItem>
                            <SelectItem value="persuasive">{t.admin.tones.persuasive}</SelectItem>
                            <SelectItem value="educational">{t.admin.tones.educational}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t.admin.length}</Label>
                        <Select value={aiLength} onValueChange={setAiLength}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">{t.admin.lengths.short}</SelectItem>
                            <SelectItem value="medium">{t.admin.lengths.medium}</SelectItem>
                            <SelectItem value="long">{t.admin.lengths.long}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="audience">{t.admin.targetAudience}</Label>
                      <Input
                        id="audience"
                        value={aiTargetAudience}
                        onChange={(e) => setAiTargetAudience(e.target.value)}
                        placeholder="e.g. Tech startup founders, marketing professionals..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="keywords">{t.admin.keywords}</Label>
                      <Input
                        id="keywords"
                        value={aiKeywords}
                        onChange={(e) => setAiKeywords(e.target.value)}
                        placeholder="keyword1, keyword2, keyword3..."
                      />
                    </div>
                    <Button
                      onClick={handleGenerateText}
                      disabled={isGeneratingText || isNew}
                      className="w-full"
                    >
                      {isGeneratingText ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {t.admin.generating}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          {t.admin.generateText}
                        </>
                      )}
                    </Button>
                    {isNew && (
                      <p className="text-xs text-muted-foreground text-center">
                        Save the post first to enable AI generation
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo" className="mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label htmlFor="metaTitle">{t.admin.metaTitle}</Label>
                      <Input
                        id="metaTitle"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder="SEO title (max 60 chars)"
                        maxLength={60}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {metaTitle.length}/60 characters
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="metaDesc">{t.admin.metaDescription}</Label>
                      <Textarea
                        id="metaDesc"
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="SEO description (max 160 chars)"
                        maxLength={160}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {metaDescription.length}/160 characters
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>{t.admin.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={categoryId || ""} onValueChange={(v) => setCategoryId(v || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle>{t.admin.coverImage}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {coverImageUrl && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={coverImageUrl}
                      alt="Cover"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="imageTheme">Image theme</Label>
                  <Input
                    id="imageTheme"
                    value={imageTheme}
                    onChange={(e) => setImageTheme(e.target.value)}
                    placeholder="Describe the image..."
                  />
                </div>
                <div>
                  <Label>Style</Label>
                  <Select value={imageStyle} onValueChange={setImageStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern illustration">Modern Illustration</SelectItem>
                      <SelectItem value="realistic photo">Realistic Photo</SelectItem>
                      <SelectItem value="3D render">3D Render</SelectItem>
                      <SelectItem value="flat design">Flat Design</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || isNew}
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Image className="h-4 w-4" />
                    )}
                    <span className="ml-2">Generate</span>
                  </Button>
                  <Label
                    htmlFor="imageUpload"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </Label>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t.admin.schedule}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="scheduledAt">{t.admin.scheduledFor}</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSchedule}
                  disabled={isSaving || !scheduledAt}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {t.admin.schedule}
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            {!isNew && status === "published" && (
              <Link to={`/blog/${slug}`} target="_blank">
                <Button variant="outline" className="w-full gap-2">
                  <Eye className="h-4 w-4" />
                  {t.admin.preview}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
