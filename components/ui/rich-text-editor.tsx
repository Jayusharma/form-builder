import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import { Button } from './button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const styles = `
  .editor-content {
    white-space: pre-wrap !important;
  }

  .editor-content p {
    white-space: pre-wrap !important;
    min-height: 1em;
    margin: 0 !important;
  }

  .editor-content p:empty::before {
    content: "\\00a0";
    white-space: pre;
  }

  .editor-content p + p {
    margin-top: 1em !important;
  }

  .editor-content ol {
    list-style-type: decimal !important;
    margin-left: 1.5rem !important;
    padding-left: 0.5rem !important;
  }
  
  .editor-content ul {
    list-style-type: disc !important;
    margin-left: 1.5rem !important;
    padding-left: 0.5rem !important;
  }
  
  .editor-content li {
    margin: 0.25rem 0 !important;
  }
`;

// Custom extension for preserving whitespace and handling paste
const WhitespacePreserveExtension = Extension.create({
  name: 'whitespacePreserve',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          preserveWhitespace: {
            default: true,
            parseHTML: () => true,
            renderHTML: () => ({ 
              style: 'white-space: pre-wrap; word-wrap: break-word; min-height: 1em;' 
            }),
          },
        },
      },
    ];
  },
});

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start writing...',
  readOnly = false 
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        paragraph: {
          HTMLAttributes: {
            style: 'white-space: pre-wrap; word-wrap: break-word; min-height: 1em;',
          },
        },
      }),
      WhitespacePreserveExtension,
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc ml-4',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'ordered-list',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'list-item',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'before:content-[attr(data-placeholder)] before:text-muted-foreground before:h-0 before:float-left before:pointer-events-none',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        spellcheck: 'false',
      },
      handlePaste: (view, event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // Try to get HTML content first
        const html = clipboardData.getData('text/html');
        if (html) {
          // Let TipTap handle HTML content
          return false;
        }

        // If no HTML, handle plain text with preserved whitespace
        const text = clipboardData.getData('text/plain');
        if (!text) return false;

        const { tr } = view.state;
        const { from, to } = view.state.selection;

        // Process the text to preserve multiple newlines
        const processedText = text
          .replace(/\r\n/g, '\n') // Normalize line endings
          .replace(/\n{2,}/g, (match) => {
            // For each group of newlines, create appropriate number of paragraphs
            return '\n'.repeat(match.length);
          });

        // Replace selection with processed text
        tr.insertText(processedText, from, to);
        view.dispatch(tr);

        return true;
      },
      handleKeyDown: (view, event) => {
        // Handle Enter key to preserve consecutive newlines
        if (event.key === 'Enter') {
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;
          
          // Check if the current line is empty
          const isEmptyLine = $from.parent.content.size === 0;
          
          if (isEmptyLine) {
            // Create a new paragraph
            view.dispatch(view.state.tr.split(selection.from));
            return true;
          }
        }
        return false;
      },
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="border rounded-md">
        {!readOnly && (
          <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-accent' : ''}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-accent' : ''}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-accent' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'bg-accent' : ''}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addLink}
              className={editor.isActive('link') ? 'bg-accent' : ''}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        )}
        <EditorContent 
          editor={editor} 
          className={`editor-content p-3 min-h-[100px] ${readOnly ? 'bg-muted/50' : 'bg-background'}`}
        />
      </div>
    </>
  );
} 