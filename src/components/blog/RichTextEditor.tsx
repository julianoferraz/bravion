import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Eye,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  className,
}: RichTextEditorProps) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  // Sync HTML to editor when switching to visual mode
  useEffect(() => {
    if (mode === "visual" && editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [mode]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorChange();
  }, []);

  const handleEditorChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleHtmlChange = useCallback(
    (html: string) => {
      onChange(html);
    },
    [onChange]
  );

  const insertHeading = (level: number) => {
    execCommand("formatBlock", `h${level}`);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      execCommand("insertImage", url);
    }
  };

  const ToolbarButton = ({
    icon: Icon,
    command,
    value,
    title,
    onClick,
  }: {
    icon: React.ElementType;
    command?: string;
    value?: string;
    title: string;
    onClick?: () => void;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      title={title}
      onClick={() => (onClick ? onClick() : command && execCommand(command, value))}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn("border border-input rounded-lg overflow-hidden bg-background", className)}>
      {/* Editor Mode Tabs */}
      <div className="flex items-center justify-between border-b border-border px-2 py-1 bg-muted/30">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "visual" | "html")}>
          <TabsList className="h-8 p-0.5">
            <TabsTrigger value="visual" className="text-xs px-3 py-1 gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="html" className="text-xs px-3 py-1 gap-1.5">
              <Code2 className="h-3.5 w-3.5" />
              HTML
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {mode === "visual" && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1 bg-muted/20">
            {/* Undo/Redo */}
            <ToolbarButton icon={Undo} command="undo" title="Undo" />
            <ToolbarButton icon={Redo} command="redo" title="Redo" />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Headings */}
            <ToolbarButton icon={Heading1} title="Heading 1" onClick={() => insertHeading(1)} />
            <ToolbarButton icon={Heading2} title="Heading 2" onClick={() => insertHeading(2)} />
            <ToolbarButton icon={Heading3} title="Heading 3" onClick={() => insertHeading(3)} />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Text Formatting */}
            <ToolbarButton icon={Bold} command="bold" title="Bold" />
            <ToolbarButton icon={Italic} command="italic" title="Italic" />
            <ToolbarButton icon={Underline} command="underline" title="Underline" />
            <ToolbarButton icon={Strikethrough} command="strikeThrough" title="Strikethrough" />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Lists */}
            <ToolbarButton icon={List} command="insertUnorderedList" title="Bullet List" />
            <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Numbered List" />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Alignment */}
            <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Align Left" />
            <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Align Center" />
            <ToolbarButton icon={AlignRight} command="justifyRight" title="Align Right" />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Insert */}
            <ToolbarButton icon={Link} title="Insert Link" onClick={insertLink} />
            <ToolbarButton icon={Image} title="Insert Image" onClick={insertImage} />
            <ToolbarButton icon={Quote} command="formatBlock" value="blockquote" title="Quote" />
            <ToolbarButton icon={Code} command="formatBlock" value="pre" title="Code Block" />
          </div>

          {/* Visual Editor */}
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[400px] p-4 focus:outline-none prose prose-invert prose-sm max-w-none
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-3
              [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2
              [&_p]:mb-4 [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
              [&_li]:mb-1
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4
              [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:my-4
              [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
              [&_a]:text-primary [&_a]:underline
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4"
            onInput={handleEditorChange}
            onBlur={handleEditorChange}
            dangerouslySetInnerHTML={{ __html: value }}
            data-placeholder={placeholder}
          />
        </>
      )}

      {mode === "html" && (
        <Textarea
          value={value}
          onChange={(e) => handleHtmlChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[450px] border-0 rounded-none font-mono text-sm resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      )}
    </div>
  );
}
