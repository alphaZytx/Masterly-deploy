import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Video, CheckCircle, Loader2 } from "lucide-react";

interface MarkAsReadProps {
  contentRead: boolean;
  setContentRead: (val: boolean) => void;
  videoRead: boolean;
  setVideoRead: (val: boolean) => void;
  onBothRead: () => void;
  conceptId: string;
  courseId: string;
}

export default function MarkAsRead({ contentRead, setContentRead, videoRead, setVideoRead, onBothRead, conceptId, courseId }: MarkAsReadProps) {
  const [loading, setLoading] = useState(false);

  const markContentRead = async () => {
    setLoading(true);
    await fetch(`/api/learning/concepts/${conceptId}/progress`, {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_description_read', courseId }),
    });
    setContentRead(true);
    setLoading(false);
    if (videoRead) onBothRead();
  };

  const markVideoRead = async () => {
    setLoading(true);
    await fetch(`/api/learning/concepts/${conceptId}/progress`, {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_video_watched', courseId }),
    });
    setVideoRead(true);
    setLoading(false);
    if (contentRead) onBothRead();
  };

  return (
    <div className="flex gap-4 mb-6">
      <Button
        onClick={markContentRead}
        disabled={contentRead || loading}
        className={contentRead ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : contentRead ? (
          <CheckCircle className="w-4 h-4 mr-2" />
        ) : (
          <BookOpen className="w-4 h-4 mr-2" />
        )}
        {contentRead ? 'Content Read' : 'Mark Content as Read'}
      </Button>
      <Button
        onClick={markVideoRead}
        disabled={videoRead || loading}
        className={videoRead ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : videoRead ? (
          <CheckCircle className="w-4 h-4 mr-2" />
        ) : (
          <Video className="w-4 h-4 mr-2" />
        )}
        {videoRead ? 'Video Watched' : 'Mark Video as Watched'}
      </Button>
    </div>
  );
} 