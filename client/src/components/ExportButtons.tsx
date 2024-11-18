import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import { useToast } from '../hooks/use-toast';

type ExportButtonsProps = {
  username: string;
};

export function ExportButtons({ username }: ExportButtonsProps) {
  const { toast } = useToast();

  const handleDownload = useCallback(async () => {
    const receipt = document.getElementById('receipt')?.parentElement?.parentElement;
    if (receipt) {
      try {
        // Create a wrapper to maintain padding during capture
        const wrapper = document.createElement('div');
        wrapper.style.padding = '32px';
        wrapper.style.background = 'transparent';
        wrapper.appendChild(receipt.cloneNode(true));
        document.body.appendChild(wrapper);

        const canvas = await html2canvas(wrapper, {
          backgroundColor: null,
          scale: 3, // Higher resolution
          logging: false,
          allowTaint: true,
          useCORS: true,
          onclone: (doc) => {
            const receiptClone = doc.querySelector('#receipt')?.parentElement?.parentElement;
            if (receiptClone) {
              // Ensure styles are properly applied for capture
              receiptClone.style.transform = 'rotate(1deg)';
              receiptClone.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
            }
          }
        });

        // Clean up the temporary wrapper
        document.body.removeChild(wrapper);
        
        // Create a new canvas with padding
        const paddedCanvas = document.createElement('canvas');
        const ctx = paddedCanvas.getContext('2d');
        if (!ctx) return;

        // Add padding around the image
        const padding = 60;
        paddedCanvas.width = canvas.width + (padding * 2);
        paddedCanvas.height = canvas.height + (padding * 2);
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
        
        // Draw the original canvas in the center
        ctx.drawImage(canvas, padding, padding);
        
        const link = document.createElement('a');
        link.download = `x-receipt-${username}.png`;
        link.href = paddedCanvas.toDataURL('image/png');
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
