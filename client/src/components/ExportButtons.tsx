import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useToast } from '../hooks/use-toast';

type ExportButtonsProps = {
  username: string;
};

export function ExportButtons({ username }: ExportButtonsProps) {
  const { toast } = useToast();

  const captureReceipt = async () => {
    const wrapper = document.getElementById('receipt-wrapper');
    if (!wrapper) return null;

    // Create a clone of the wrapper with exact styling
    const clone = wrapper.cloneNode(true) as HTMLElement;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = `${wrapper.offsetWidth}px`;
    container.style.height = `${wrapper.offsetHeight}px`;
    container.style.padding = '40px';
    container.style.background = '#f9fafb';
    container.appendChild(clone);
    document.body.appendChild(container);

    // Ensure all styles are applied before capture
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(container, {
        scale: 3,
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#f9fafb',
        logging: false,
        onclone: (doc) => {
          const clonedWrapper = doc.getElementById('receipt-wrapper');
          if (clonedWrapper) {
            // Copy computed styles from original to clone
            const styles = window.getComputedStyle(wrapper);
            clonedWrapper.style.cssText = styles.cssText;
            
            // Ensure specific styles are preserved
            clonedWrapper.style.transform = 'rotate(1deg)';
            clonedWrapper.style.filter = wrapper.style.filter;
            clonedWrapper.style.backgroundImage = wrapper.style.backgroundImage;
            clonedWrapper.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
          }
        }
      });

      document.body.removeChild(container);
      return canvas;
    } catch (error) {
      document.body.removeChild(container);
      throw error;
    }
  };

  const handleDownload = useCallback(async () => {
    try {
      const canvas = await captureReceipt();
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `x-receipt-${username}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to download receipt",
        variant: "destructive",
      });
    }
  }, [username, toast]);

  const handleDownloadPDF = useCallback(async () => {
    try {
      const canvas = await captureReceipt();
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width + 80, canvas.height + 80]
      });

      // Add white background
      pdf.setFillColor(249, 250, 251);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');

      // Center the image on the page
      const xOffset = (pdf.internal.pageSize.getWidth() - canvas.width) / 2;
      const yOffset = (pdf.internal.pageSize.getHeight() - canvas.height) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, canvas.width, canvas.height);
      pdf.save(`x-receipt-${username}.pdf`);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
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
        Download PNG
      </button>
      <button
        onClick={handleDownloadPDF}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
      >
        Download PDF
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
