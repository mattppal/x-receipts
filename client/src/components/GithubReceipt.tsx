import { useCallback } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { ReceiptLayout, ReceiptHeader, ReceiptLine, ReceiptFooter } from './ReceiptLayout';
import { ExportButtons } from './ExportButtons';
import { fetchGithubUser } from '../lib/github';

type GithubReceiptProps = {
  username: string;
};

export function GithubReceipt({ username }: GithubReceiptProps) {
  const { data: user, error } = useSWR(
    username ? `/github/users/${username}` : null,
    () => fetchGithubUser(username)
  );

  if (error) {
    return <div className="text-center text-red-500">Failed to load user data</div>;
  }

  if (!user) {
    return <div className="text-center">Loading...</div>;
  }

  const orderNumber = Math.floor(Math.random() * 9000 + 1000).toString();
  const authCode = Math.floor(Math.random() * 900000 + 100000).toString();
  const cardNumber = '**** **** ****' + Math.floor(Math.random() * 9000 + 1000).toString();

  return (
    <>
      <ReceiptLayout username={username}>
        <ReceiptHeader 
          title="DEVELOPER RECEIPT"
          date={format(new Date(), 'EEEE, MMMM dd, yyyy').toUpperCase()}
          orderNumber={orderNumber}
        />
        
        <div className="space-y-2">
          <ReceiptLine label="CUSTOMER:" value={user.name || user.login} />
          <ReceiptLine label="@" value={user.login} />
          <ReceiptLine label="REPOSITORIES:" value={user.public_repos} />
          <ReceiptLine label="STARS EARNED:" value={user.stars || 0} />
          <ReceiptLine label="REPO FORKS:" value={user.forks || 0} />
          <ReceiptLine label="FOLLOWERS:" value={user.followers} />
          <ReceiptLine label="FOLLOWING:" value={user.following} />
          
          <div className="my-4" />
          
          <ReceiptLine label="TOP LANGUAGES:" value={user.languages || 'NONE'} />
          <ReceiptLine label="MOST ACTIVE DAY:" value="Friday" />
          <ReceiptLine label="TOTAL SIZE:" value="478MB" />
          <ReceiptLine label="CONTRIBUTION SCORE:" value={user.contributions || 0} />
        </div>

        <ReceiptFooter 
          text="THANK YOU FOR CODING!"
          cardInfo={{
            cardNumber,
            authCode,
            cardHolder: user.login.toUpperCase()
          }}
        />
      </ReceiptLayout>
      
      <ExportButtons username={username} />
    </>
  );
}
