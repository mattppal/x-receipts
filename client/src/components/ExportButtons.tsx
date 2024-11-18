import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useToast } from '../hooks/use-toast';

type ExportButtonsProps = {
  username: string;
};

export function ExportButtons({ username }: ExportButtonsProps) {
  const { toast } = useToast();

  const handleDownload = useCallback(async () => {
    const receipt = document.getElementById('receipt');
    if (receipt) {
      try {
        const canvas = await html2canvas(receipt, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
        });
        
        const link = document.createElement('a');
        link.download = `github-receipt-${username}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to download receipt",
          variant: "destructive",
        });
      }
    }
  }, [username, toast]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'GitHub Receipt',
        text: `Check out ${username}'s GitHub receipt!`,
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
        onClick={handleDownload}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
      >
        Download
      </button>
      <button
        onClick={handleShare}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
      >
        Share
      </button>
    </div>
  );
}
