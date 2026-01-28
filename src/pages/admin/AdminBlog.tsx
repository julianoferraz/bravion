import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Trash,
  Archive,
  Copy,
  Send,
  FolderOpen,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type PostStatus = "draft" | "generating" | "ready" | "scheduled" | "published" | "failed" | "archived" | "deleted";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  author_id: string;
  published_at: string | null;
  scheduled_at: string | null;
  updated_at: string;
  created_at: string;
}

const statusColors: Record<PostStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  generating: "bg-yellow-500/20 text-yellow-500",
  ready: "bg-blue-500/20 text-blue-500",
  scheduled: "bg-purple-500/20 text-purple-500",
  published: "bg-green-500/20 text-green-500",
  failed: "bg-red-500/20 text-red-500",
  archived: "bg-gray-500/20 text-gray-500",
  deleted: "bg-red-900/20 text-red-900",
};

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { user, canManageBlog, isAdmin, isEditor } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!canManageBlog) {
      navigate("/login");
      return;
    }
    fetchPosts();
  }, [canManageBlog]);

  const fetchPosts = async () => {
    setIsLoading(true);

    let query = supabase
      .from("blog_posts")
      .select("id, title, slug, status, author_id, published_at, scheduled_at, updated_at, created_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } else {
      setPosts(data || []);
    }

    setIsLoading(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm(t.admin.confirmDelete)) return;

    const { error } = await supabase
      .from("blog_posts")
      .update({ deleted_at: new Date().toISOString(), status: "deleted" })
      .eq("id", postId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } else {
      toast({ title: "Post deleted" });
      fetchPosts();
    }
  };

  const handleArchive = async (postId: string) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({ status: "archived" })
      .eq("id", postId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to archive post",
        variant: "destructive",
      });
    } else {
      toast({ title: "Post archived" });
      fetchPosts();
    }
  };

  const handlePublishNow = async (postId: string) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to publish post",
        variant: "destructive",
      });
    } else {
      toast({ title: "Post published!" });
      fetchPosts();
    }
  };

  const handleDuplicate = async (postId: string) => {
    const originalPost = posts.find((p) => p.id === postId);
    if (!originalPost) return;

    const { data: fullPost } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (!fullPost) return;

    const { id, created_at, updated_at, published_at, scheduled_at, ...postData } = fullPost;

    const { error } = await supabase.from("blog_posts").insert({
      ...postData,
      title: `${postData.title} (Copy)`,
      slug: `${postData.slug}-copy-${Date.now()}`,
      status: "draft",
      author_id: user?.id,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate post",
        variant: "destructive",
      });
    } else {
      toast({ title: "Post duplicated" });
      fetchPosts();
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || post.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!canManageBlog) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t.admin.posts}</h1>
            <p className="text-muted-foreground">
              Manage your blog posts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/blog/categories">
              <Button variant="outline" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                {t.admin.categories}
              </Button>
            </Link>
            <Link to="/admin/blog/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t.admin.newPost}
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">{t.admin.statuses.draft}</SelectItem>
              <SelectItem value="generating">{t.admin.statuses.generating}</SelectItem>
              <SelectItem value="ready">{t.admin.statuses.ready}</SelectItem>
              <SelectItem value="scheduled">{t.admin.statuses.scheduled}</SelectItem>
              <SelectItem value="published">{t.admin.statuses.published}</SelectItem>
              <SelectItem value="failed">{t.admin.statuses.failed}</SelectItem>
              <SelectItem value="archived">{t.admin.statuses.archived}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.admin.title}</TableHead>
                <TableHead>{t.admin.status}</TableHead>
                <TableHead className="hidden md:table-cell">{t.admin.scheduledFor}</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
                <TableHead className="text-right">{t.admin.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No posts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{post.title}</p>
                        <p className="text-xs text-muted-foreground">{post.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[post.status]}>
                        {t.admin.statuses[post.status] || post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {post.scheduled_at
                        ? format(new Date(post.scheduled_at), "MMM d, yyyy HH:mm")
                        : post.published_at
                        ? format(new Date(post.published_at), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {format(new Date(post.updated_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/blog/${post.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {post.status === "published" && (
                            <DropdownMenuItem asChild>
                              <Link to={`/blog/${post.slug}`} target="_blank">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDuplicate(post.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {(isAdmin || isEditor) &&
                            (post.status === "ready" || post.status === "draft") && (
                              <DropdownMenuItem onClick={() => handlePublishNow(post.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                Publish Now
                              </DropdownMenuItem>
                            )}
                          {post.status !== "archived" && (
                            <DropdownMenuItem onClick={() => handleArchive(post.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(post.id)}
                              className="text-destructive"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
