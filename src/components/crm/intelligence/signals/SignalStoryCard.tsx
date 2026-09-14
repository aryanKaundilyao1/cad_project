import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { OpportunitySignalFeed } from "@/services/intelligence/signals/OpportunitySignalFeed";

interface SignalStoryCardProps {
  opportunityId: string;
  masterScore?: number;
}

export function SignalStoryCard({ opportunityId, masterScore = 50 }: SignalStoryCardProps) {
  const [story, setStory] = useState<string>("Loading signal narrative...");
  
  useEffect(() => {
    const fetchStory = async () => {
      try {
        const feed = await OpportunitySignalFeed.getFeed(opportunityId, masterScore);
        setStory(feed.story);
      } catch (err) {
        setStory("Signal narrative could not be loaded.");
      }
    };
    fetchStory();
  }, [opportunityId, masterScore]);

  return (
    <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-100">
      <CardContent className="p-4 flex gap-4 items-start">
        <div className="rounded-full bg-blue-100 p-2 mt-1">
          <Sparkles className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800 mb-1">Signal Intelligence</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {story}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
