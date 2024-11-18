import { useCallback } from 'react';
import useSWR from 'swr';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { useToast } from '../hooks/use-toast';
import { ReceiptLayout, ReceiptHeader, ReceiptLine, ReceiptFooter } from './ReceiptLayout';
import { fetchGithubUser } from '../lib/github';

type GithubReceiptProps = {
  username: string;
};

export function GithubReceipt({ username }: GithubReceiptProps) {
  const { data: user, error } = useSWR(
    username ? `/github/users/${username}` : null,
    () => fetchGithubUser(username)
  );
  
  const { toast } = useToast();

  const handleDownload = useCallback(async () => {
    const receipt = document.getElementById('receipt');
    if (receipt) {
      try {
        const canvas = await html2canvas(receipt);
        const link = document.createElement('a');
        link.download = `github-receipt-${username}.png`;
        link.href = canvas.toDataURL();
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

  if (error) {
    return <div className="text-center text-red-500">Failed to load user data</div>;
  }

  if (!user) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <ReceiptLayout onDownload={handleDownload} onShare={handleShare}>
      <ReceiptHeader 
        title="GITHUB RECEIPT"
        date={format(new Date(), 'EEEE, MMMM dd, yyyy')}
      />
      
      <div className="space-y-2">
        <ReceiptLine label="CUSTOMER:" value={user.login} />
        <ReceiptLine label="REPOSITORIES:" value={user.public_repos} />
        <ReceiptLine label="FOLLOWERS:" value={user.followers} />
        <ReceiptLine label="FOLLOWING:" value={user.following} />
        <ReceiptLine 
          label="MEMBER SINCE:" 
          value={format(new Date(user.created_at), 'MMM dd, yyyy')} 
        />
      </div>

      <ReceiptFooter text="THANK YOU FOR CODING!" />
    </ReceiptLayout>
  );
}
