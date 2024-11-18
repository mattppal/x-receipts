import { useCallback } from 'react';
import { useToast } from '../hooks/use-toast';

type ExportButtonsProps = {
  username: string;
};

export function ExportButtons({ username }: ExportButtonsProps) {
  const { toast } = useToast();

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'X Receipt',
        text: `Check out ${username}'s X receipt!`,
        url: window.location.href,
      }).catch(() => {
        toast({
          title: "Error",
          description: "Failed to share receipt",
          variant: "destructive",
        });
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Success",
        description: "Link copied to clipboard",
      });
    }
  }, [username, toast]);

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black/75 backdrop-blur-sm rounded-full p-2 flex gap-2">
      <button
        onClick={handleShare}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
      >
        Share
      </button>
    </div>
  );
}