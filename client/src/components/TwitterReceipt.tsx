import { useCallback } from 'react';
import useSWR from 'swr';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { useToast } from '../hooks/use-toast';
import { ReceiptLayout, ReceiptHeader, ReceiptLine, ReceiptFooter } from './ReceiptLayout';
import { fetchTwitterUser } from '../lib/twitter';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

type TwitterReceiptProps = {
  username: string;
};

export function TwitterReceipt({ username }: TwitterReceiptProps) {
  const { data: user, error } = useSWR(
    username ? `/twitter/users/${username}` : null,
    () => fetchTwitterUser(username)
  );
  
  const { toast } = useToast();

  const handleDownload = useCallback(async () => {
    const receipt = document.getElementById('receipt');
    if (receipt) {
      try {
        const canvas = await html2canvas(receipt, {
          backgroundColor: '#ffffff',
          scale: 2,
          windowWidth: receipt.scrollWidth,
          windowHeight: receipt.scrollHeight,
          x: 0,
          y: 0,
          width: receipt.offsetWidth,
          height: receipt.offsetHeight,
          useCORS: true,
          logging: false,
          padding: 20
        });
        
        const link = document.createElement('a');
        link.download = `twitter-receipt-${username}.png`;
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

  const handleDownloadPDF = useCallback(async () => {
    const receipt = document.getElementById('receipt');
    if (receipt) {
      try {
        const canvas = await html2canvas(receipt, {
          backgroundColor: '#ffffff',
          scale: 2,
          windowWidth: receipt.scrollWidth,
          windowHeight: receipt.scrollHeight,
          x: 0,
          y: 0,
          width: receipt.offsetWidth,
          height: receipt.offsetHeight,
          useCORS: true,
          logging: false,
          padding: 20
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width + 40, canvas.height + 40]
        });
        
        pdf.addImage(imgData, 'PNG', 20, 20, canvas.width, canvas.height);
        pdf.save(`twitter-receipt-${username}.pdf`);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to download PDF",
          variant: "destructive",
        });
      }
    }
  }, [username, toast]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'Twitter Receipt',
        text: `Check out ${username}'s Twitter receipt!`,
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.details || error.message || 'Failed to load user data. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!user) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <ReceiptLayout 
      onDownload={handleDownload} 
      onDownloadPDF={handleDownloadPDF}
      onShare={handleShare}
    >
      <ReceiptHeader 
        title="TWITTER RECEIPT"
        date={format(new Date(), 'EEEE, MMMM dd, yyyy')}
      />
      
      <div className="space-y-2">
        <ReceiptLine label="CUSTOMER:" value={user.name} />
        <ReceiptLine label="@USERNAME:" value={user.username} />
        <ReceiptLine label="BIO:" value={user.description || 'No bio'} />
        <ReceiptLine label="LOCATION:" value={user.location || 'Not specified'} />
        <ReceiptLine label="TWEETS:" value={user.tweet_count.toLocaleString()} />
        <ReceiptLine label="FOLLOWERS:" value={user.followers_count.toLocaleString()} />
        <ReceiptLine label="FOLLOWING:" value={user.following_count.toLocaleString()} />
        <ReceiptLine label="LISTED:" value={user.listed_count.toLocaleString()} />
        <ReceiptLine label="LIKES:" value={user.likes_count.toLocaleString()} />
        <ReceiptLine label="VERIFIED:" value={user.verified ? 'Yes' : 'No'} />
        <ReceiptLine 
          label="MEMBER SINCE:" 
          value={format(new Date(user.created_at), 'MMM dd, yyyy')} 
        />
      </div>

      <ReceiptFooter text="THANK YOU FOR TWEETING!" />
    </ReceiptLayout>
  );
}
