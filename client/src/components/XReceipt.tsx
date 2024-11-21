import useSWR from "swr";
import { format, differenceInYears } from "date-fns";
import { fetchXUser } from "../lib/x";

import {
  ReceiptLayout,
  ReceiptHeader,
  ReceiptLine,
  ReceiptFooter,
} from "./ReceiptLayout";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { QRCodeSVG } from "qrcode.react";
import { Link as LinkIcon } from "lucide-react";

type XReceiptProps = {
  username: string;
};

export function XReceipt({ username }: XReceiptProps) {
  const { data: user, error: userError } = useSWR(
    username ? `/x/users/${username}?user.fields=verified_type` : null,
    () => fetchXUser(username),
  );
  
  if (userError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {userError.details ||
            userError.message ||
            "Failed to load user data. Please try again."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!user) {
    return <div className="text-center">Loading...</div>;
  }

  const orderNumber = `${username.toUpperCase()}-${Date.now().toString(36)}`;
  const accountAge = differenceInYears(new Date(), new Date(user.created_at));
  
  const profileUrl = (() => {
    if (user.entities?.url?.urls?.[0]?.expanded_url) {
      return user.entities.url.urls[0].expanded_url;
    }
    if (user.url) {
      return user.url;
    }
    return `https://x.com/${user.username}`;
  })();
  
  const getVerificationString = (type: string) => {
    switch (type) {
      case 'blue':
        return 'Blue';
      case 'business':
        return 'Business';
      case 'government':
        return 'Government';
      case 'none':
      default:
        return 'No';
    }
  };

  return (
    <div>
      <ReceiptLayout
        username={username}
        verifiedType={user.verified_type}
        accountAge={accountAge}
      >
        <ReceiptHeader
          date={format(new Date(), "EEEE, MMMM dd, yyyy")}
          orderNumber={orderNumber}
        />

        {user.profile_image_url && (
          <div className="flex justify-center mb-6">
            <img
              src={user.profile_image_url}
              alt={`${user.name}'s profile`}
              className="w-24 h-24 rounded-full border-4 border-gray-200"
              crossOrigin="anonymous"
            />
          </div>
        )}

        <div className="space-y-2">
          <ReceiptLine label="CUSTOMER:" value={user.name} />
          <ReceiptLine label="@USERNAME:" value={user.username} />
          <ReceiptLine label="BIO:" value={user.description || "No bio"} />
          <ReceiptLine
            label="LOCATION:"
            value={user.location || "???"}
          />
          <ReceiptLine
            label="WEBSITE:"
            value={
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline flex items-center gap-1"
              >
                <LinkIcon className="w-3 h-3" />
                {profileUrl}
              </a>
            }
          />
        </div>

        <Separator/>

        <div className="space-y-2">
          <ReceiptLine
            label="POSTS:"
            value={user.public_metrics.tweet_count.toLocaleString()}
          />
          <ReceiptLine
            label="FOLLOWERS:"
            value={user.public_metrics.followers_count.toLocaleString()}
          />
          <ReceiptLine
            label="FOLLOWING:"
            value={user.public_metrics.following_count.toLocaleString()}
          />
          <ReceiptLine
            label="LISTED:"
            value={user.public_metrics.listed_count.toLocaleString()}
          />
          <ReceiptLine
            label="LIKES:"
            value={user.public_metrics.like_count.toLocaleString()}
          />
        </div>

        <Separator className="my-4 border-dashed" />

        <div className="space-y-2">
          <ReceiptLine
            label="VERIFIED:"
            value={getVerificationString(user.verified_type)}
            verified={user.verified_type !== 'none'}
          />
          <ReceiptLine
            label="MEMBER SINCE:"
            value={format(new Date(user.created_at), "MMM dd, yyyy")}
          />
        </div>

        {user.pinned_tweet_id && user.pinned_tweet && (
          <>
            <Separator className="my-4 border-dashed" />
            <div className="space-y-2">
              <div className="text-center font-bold mb-2">📌 PINNED TWEET</div>
              <div className="border rounded p-3 bg-gray-50">
                <div className="text-sm mb-2">{user.pinned_tweet.text}</div>
                <div className="text-xs text-gray-500 flex items-center gap-4">
                  <span>
                    {format(
                      new Date(user.pinned_tweet.created_at),
                      "MMM dd, yyyy",
                    )}
                  </span>
                  <div className="flex gap-4">
                    <span>🔄 {user.pinned_tweet.retweet_count || 0}</span>
                    <span>💬 {user.pinned_tweet.reply_count || 0}</span>
                    <span>❤️ {user.pinned_tweet.like_count || 0}</span>
                  </div>
                </div>
                {user.pinned_tweet.media &&
                  user.pinned_tweet.media.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      📷 {user.pinned_tweet.media.length} media attachment
                      {user.pinned_tweet.media.length !== 1 ? "s" : ""}
                    </div>
                  )}
                <div className="mt-2">
                  <a
                    href={`https://x.com/${user.username}/status/${user.pinned_tweet_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    View on X
                  </a>
                </div>
              </div>
            </div>
          </>
        )}

        <ReceiptFooter
          text="THANK YOU FOR POASTING!"
          url={profileUrl}
          footerLink={
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:underline"
            >
              Visit Profile
            </a>
          }
        />

        <div className="mt-6 pt-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <QRCodeSVG
              value={profileUrl}
              size={128}
              level="L"
              includeMargin={false}
            />
            <span className="text-xs text-gray-500">x.com/{user.username}</span>
          </div>
        </div>

      </ReceiptLayout>
    </div>
  );
}