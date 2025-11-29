'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateAssignmentSuggestions } from '@/ai/flows/generate-assignment-suggestions';
import { generateAssignmentInstructions as autoGenerateAssignmentInstructions } from '@/ai/flows/auto-generate-assignment-instructions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface AiAssistantProps {
    onSuggestionSelect: (title: string, description: string) => void;
}

export function AiAssistant({ onSuggestionSelect }: AiAssistantProps) {
  const [topic, setTopic] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingInstructions, setLoadingInstructions] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleGenerateSuggestions = async () => {
    if (!topic) {
        toast({ variant: "destructive", title: "Please enter a course topic." });
        return;
    }
    setLoadingSuggestions(true);
    try {
      const result = await generateAssignmentSuggestions({ courseTopic: topic });
      setSuggestions(result.assignmentSuggestions);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to generate suggestions.' });
    } finally {
      setLoadingSuggestions(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setFile(e.target.files[0]);
    }
  }

  const handleGenerateInstructions = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'Please select a file.' });
      return;
    }
    if (!topic) {
      toast({ variant: 'destructive', title: 'Please enter a course topic.' });
      return;
    }
    setLoadingInstructions(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
          const dataUri = reader.result as string;
          const result = await autoGenerateAssignmentInstructions({
              files: [{ filename: file.name, dataUri }],
              courseTopic: topic,
          });
          onSuggestionSelect(file.name.split('.')[0], result.instructions);
          toast({ title: 'Instructions generated and applied!' });
          setOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to generate instructions.' });
    } finally {
        setLoadingInstructions(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI-Powered Assignment Assistant</DialogTitle>
          <DialogDescription>
            Generate assignment ideas or auto-create instructions from a file.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Generate Suggestions</h3>
            <div className="space-y-2">
              <Label htmlFor="topic">Course Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., World War II, Photosynthesis"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <Button onClick={handleGenerateSuggestions} disabled={loadingSuggestions} className="w-full">
              {loadingSuggestions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Ideas
            </Button>
            {suggestions.length > 0 && (
                <Card className="max-h-60 overflow-y-auto">
                    <CardContent className="p-4">
                        <ul className="space-y-2">
                            {suggestions.map((s, i) => (
                                <li key={i} className="text-sm p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => {
                                    onSuggestionSelect(s, '');
                                    setOpen(false);
                                    toast({ title: "Title populated from suggestion!"});
                                }}>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Generate from File</h3>
            <div className="space-y-2">
                <Label htmlFor="file-upload">Assignment File</Label>
                <Input id="file-upload" type="file" onChange={handleFileChange} />
            </div>
             <Button onClick={handleGenerateInstructions} disabled={loadingInstructions || !topic} className="w-full">
              {loadingInstructions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Instructions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
