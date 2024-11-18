import { useCallback } from "react";
import useSWR from "swr";
import html2canvas from "html2canvas";
import { format, differenceInYears } from "date-fns";
import { fetchXUser } from "../lib/x";
import { useToast } from "../hooks/use-toast";
import {
  ReceiptLayout,
  ReceiptHeader,
  ReceiptLine,
  ReceiptFooter,
} from "./ReceiptLayout";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { QRCodeSVG } from "qrcode.react";
import { Icons } from "./ui/icons";
import { Link as LinkIcon } from "lucide-react";
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink,
  Font 
} from '@react-pdf/renderer';

// Register a default font
Font.register({
  family: 'Inter',
  src: 'https://rsms.me/inter/font-files/Inter-Regular.woff2',
});

// PDF styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Inter',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  date: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5,
  },
  orderNumber: {
    fontSize: 10,
    color: '#888888',
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#666666',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    borderBottomStyle: 'dashed',
    marginVertical: 15,
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
  },
});

// PDF Document Component
const ReceiptPDF = ({ user, orderNumber }: { user: any, orderNumber: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>X RECEIPT</Text>
        <Text style={styles.date}>{format(new Date(), "EEEE, MMMM dd, yyyy")}</Text>
        <Text style={styles.orderNumber}>ORDER #{orderNumber}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>CUSTOMER:</Text>
          <Text style={styles.value}>{user.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>@USERNAME:</Text>
          <Text style={styles.value}>{user.username}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>BIO:</Text>
          <Text style={styles.value}>{user.description || "No bio"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>LOCATION:</Text>
          <Text style={styles.value}>{user.location || "Not specified"}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>POSTS:</Text>
          <Text style={styles.value}>{user.public_metrics.tweet_count.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>FOLLOWERS:</Text>
          <Text style={styles.value}>{user.public_metrics.followers_count.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>FOLLOWING:</Text>
          <Text style={styles.value}>{user.public_metrics.following_count.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>LISTED:</Text>
          <Text style={styles.value}>{user.public_metrics.listed_count.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>VERIFIED:</Text>
          <Text style={styles.value}>{user.verified ? "Yes" : "No"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>MEMBER SINCE:</Text>
          <Text style={styles.value}>{format(new Date(user.created_at), "MMM dd, yyyy")}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>THANK YOU FOR POSTING!</Text>
        <Text>x.com/{user.username}</Text>
      </View>
    </Page>
  </Document>
);

type XReceiptProps = {
  username: string;
};

export function XReceipt({ username }: XReceiptProps) {
  const { data: user, error: userError } = useSWR(
    username ? `/x/users/${username}` : null,
    () => fetchXUser(username),
  );

  const { toast } = useToast();

  const handleDownload = useCallback(async () => {
    const receipt = document.getElementById("receipt");
    if (receipt) {
      try {
        const canvas = await html2canvas(receipt, {
          backgroundColor: "#ffffff",
          scale: 2,
          windowWidth: receipt.scrollWidth,
          windowHeight: receipt.scrollHeight,
          x: 0,
          y: 0,
          width: receipt.offsetWidth,
          height: receipt.offsetHeight,
          useCORS: true,
          logging: false,
          padding: 20,
        });

        const link = document.createElement("a");
        link.download = `x-receipt-${username}.png`;
        link.href = canvas.toDataURL("image/png");
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
      navigator
        .share({
          title: "X Receipt",
          text: `Check out ${username}'s X receipt!`,
          url: window.location.href,
        })
        .catch(() => {
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
  const profileUrl = user.url || `https://x.com/${user.username}`;

  return (
    <ReceiptLayout
      onDownload={handleDownload}
      onDownloadPDF={
        <PDFDownloadLink
          document={<ReceiptPDF user={user} orderNumber={orderNumber} />}
          fileName={`x-receipt-${username}.pdf`}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
        >
          {({ loading }) =>
            loading ? 'Preparing PDF...' : 'Download PDF'
          }
        </PDFDownloadLink>
      }
      onShare={handleShare}
      isVerified={user.verified}
      accountAge={accountAge}
    >
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
          value={user.location || "Not specified"}
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

      <Separator className="my-4 border-dashed" />

      <div className="space-y-2">
        <ReceiptLine label="POSTS:" value={user.public_metrics.tweet_count.toLocaleString()} />
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
      </div>

      <Separator className="my-4 border-dashed" />

      <div className="space-y-2">
        <ReceiptLine
          label="VERIFIED:"
          value={user.verified ? "Yes" : "No"}
          verified={user.verified}
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
                <span>{format(new Date(user.pinned_tweet.created_at), "MMM dd, yyyy")}</span>
                <div className="flex gap-4">
                  <span>🔄 {user.pinned_tweet.retweet_count || 0}</span>
                  <span>💬 {user.pinned_tweet.reply_count || 0}</span>
                  <span>❤️ {user.pinned_tweet.like_count || 0}</span>
                </div>
              </div>
              {user.pinned_tweet.media && user.pinned_tweet.media.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  📷 {user.pinned_tweet.media.length} media attachment{user.pinned_tweet.media.length !== 1 ? 's' : ''}
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
        text="THANK YOU FOR POSTING!"
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

      <div className="mt-6 pt-4 border-t border-dashed">
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
  );
}