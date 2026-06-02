"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Mic, MicOff } from "lucide-react";
import type { ParsedExpense } from "@/lib/types";
import toast from "react-hot-toast";

interface AIExpenseFormProps {
  onParsed: (result: ParsedExpense & { category_id?: string }) => void;
  categories: { id: string; name: string }[];
}

export function AIExpenseForm({ onParsed, categories }: AIExpenseFormProps) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true);

    try {
      const res = await fetch("/api/parse-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) throw new Error("Parse failed");

      const parsed: ParsedExpense = await res.json();

      const match = categories.find(
        (c) =>
          c.name.toLowerCase() === parsed.category.toLowerCase() ||
          c.name.toLowerCase().includes(parsed.category.toLowerCase())
      );

      onParsed({ ...parsed, category_id: match?.id });
      setText("");
    } catch {
      toast.error("Couldn't parse expense. Try typing manually.");
    } finally {
      setParsing(false);
    }
  };

  const toggleVoice = () => {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast.error("Voice input not supported. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    setRecording(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
    };

    recognition.onerror = () => {
      toast.error("Voice input failed. Please try again.");
    };

    recognition.onend = () => setRecording(false);

    recognition.start();
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          placeholder={`Try:\n"Milk 120"\n"Petrol 2500"\n"Electricity bill 3200"`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="pr-12 text-base"
        />
        {/* Voice button */}
        <button
          type="button"
          onClick={toggleVoice}
          className="absolute right-3 bottom-3 p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
          aria-label={recording ? "Stop recording" : "Start voice input"}
        >
          {recording ? (
            <MicOff className="h-5 w-5 text-red-500 animate-pulse" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>
      </div>

      <Button
        onClick={handleParse}
        disabled={parsing || !text.trim()}
        className="w-full h-12"
        variant="secondary"
      >
        {parsing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {parsing ? "Parsing with AI..." : "Parse with AI"}
      </Button>
    </div>
  );
}
