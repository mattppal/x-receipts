import { useCallback } from "react";
import useSWR from "swr";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { useToast } from "../hooks/use-toast";
import {
  ReceiptLayout,
  ReceiptHeader,
  ReceiptLine,
  ReceiptFooter,
} from "./ReceiptLayout";
import { fetchXUser } from "../lib/x";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { QRCodeSVG } from "qrcode.react";

type XReceiptProps = {
  username: string;
};

export function XReceipt({ username }: XReceiptProps) {
  const { data: user, error } = useSWR(
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

  const handleDownloadPDF = useCallback(async () => {
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

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [canvas.width + 40, canvas.height + 40],
        });

        pdf.addImage(imgData, "PNG", 20, 20, canvas.width, canvas.height);
        pdf.save(`x-receipt-${username}.pdf`);
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.details ||
            error.message ||
            "Failed to load user data. Please try again."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!user) {
    return <div className="text-center">Loading...</div>;
  }

  // Generate a unique order number based on username and current timestamp
  const orderNumber = `${username.toUpperCase()}-${Date.now().toString(36)}`;

  return (
    <ReceiptLayout
      onDownload={handleDownload}
      onDownloadPDF={handleDownloadPDF}
      onShare={handleShare}
      isVerified={user.verified}
    >
      <ReceiptHeader
        title="X RECEIPT"
        date={format(new Date(), "EEEE, MMMM dd, yyyy")}
        orderNumber={orderNumber}
      />

      {/* Profile Section */}
      <div className="space-y-2">
        <ReceiptLine label="CUSTOMER:" value={user.name} />
        <ReceiptLine label="@USERNAME:" value={user.username} />
        <ReceiptLine label="BIO:" value={user.description || "No bio"} />
        <ReceiptLine
          label="LOCATION:"
          value={user.location || "Not specified"}
        />
      </div>

      <Separator className="my-4 border-dashed" />

      {/* Stats Section */}
      <div className="space-y-2">
        <ReceiptLine label="POSTS:" value={user.tweet_count.toLocaleString()} />
        <ReceiptLine
          label="FOLLOWERS:"
          value={user.followers_count.toLocaleString()}
        />
        <ReceiptLine
          label="FOLLOWING:"
          value={user.following_count.toLocaleString()}
        />
        <ReceiptLine
          label="LISTED:"
          value={user.listed_count?.toLocaleString() || "0"}
        />
        <ReceiptLine label="LIKES:" value={user.likes_count.toLocaleString()} />
      </div>

      <Separator className="my-4 border-dashed" />

      {/* Account Info Section */}
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

      <Separator className="my-4 border-dashed" />

      <ReceiptFooter 
        text="THANK YOU FOR POSTING!"
        url={user.url || `https://x.com/${user.username}`}
      />

      {/* QR Code Section */}
      <div className="mt-6 pt-4 border-t border-dashed">
        <div className="flex flex-col items-center justify-center gap-2">
          <QRCodeSVG
            value={`https://x.com/${user.username}`}
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