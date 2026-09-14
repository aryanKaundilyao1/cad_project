import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Link, Image as ImageIcon } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  // A fallback text editor that acts as a placeholder for a real rich-text editor (e.g. Quill/TipTap)
  return (
    <div className="border border-border rounded-md overflow-hidden bg-card">
      <div className="bg-muted/50 border-b border-border p-2 flex gap-1 items-center">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Bold className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Italic className="h-4 w-4" /></Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><List className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><ListOrdered className="h-4 w-4" /></Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Link className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><ImageIcon className="h-4 w-4" /></Button>
      </div>
      <Textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        className="min-h-[200px] border-0 rounded-none focus-visible:ring-0 resize-y"
      />
    </div>
  );
}
