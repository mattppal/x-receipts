import { useState, useCallback, useEffect } from "react";
import { SearchForm } from "../components/SearchForm";
import { XReceipt } from "../components/XReceipt";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { useToPng } from "@hugocxl/react-to-image";

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const demoUsers = ["elonmusk", "amasad", "sama", "mattppal"];

  useEffect(() => {
    // Reset rate limit status after 1 minute
    if (isRateLimited) {
      const timer = setTimeout(() => setIsRateLimited(false), 60000);
      return () => clearTimeout(timer);
    }
  }, [isRateLimited]);

  const handleApiError = (error: any) => {
    if (error?.status === 429) {
      setIsRateLimited(true);
      toast({
        title: "Rate Limit Exceeded",
        description: "Please wait a moment before trying again.",
        variant: "destructive",
      });
    }
  };

  const [{ isLoading }, convert, ref] = useToPng<HTMLDivElement>({
    onSuccess: async (data) => {
      try {
        const blob = await (await fetch(data)).blob();
        const clipboardItem = new ClipboardItem({
          [blob.type]: blob,
        });
        await navigator.clipboard.write([clipboardItem]);
        toast({
          title: "Success",
          description: "Receipt copied to clipboard!",
        });
      } catch (error) {
        console.error("Failed to copy image:", error);
        toast({
          title: "Error",
          description: "Failed to copy receipt to clipboard",
          variant: "destructive",
        });
      } finally {
        setIsSharing(false);
      }
    },
    onError: (error) => {
      handleApiError(error); // Use error handler
      console.error("Failed to generate image:", error);
      toast({
        title: "Error",
        description: "Failed to generate receipt image",
        variant: "destructive",
      });
      setIsSharing(false);
    },
  });

  const handleShare = useCallback(async () => {
    if (!username) return;
    setIsSharing(true);

    try {
      await convert();
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: "Error",
        description: "Failed to share receipt",
        variant: "destructive",
      });
      setIsSharing(false);
    }
  }, [username, convert, toast]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <svg
              width="32"
              height="32"
              viewBox="0 0 300 300"
              className="h-10 w-10"
              aria-hidden="true"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="currentColor"
                d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"
              />
            </svg>
            Receipts
          </h1>
          <p className="text-gray-600">
            Get a receipt of your X profile. Purely for tax purposes.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <p className="w-full text-center text-sm text-gray-500 mb-2">
            Try these examples:
          </p>
          {demoUsers.map((user) => (
            <Button
              key={user}
              variant="outline"
              size="sm"
              onClick={() => setUsername(user)}
              className="rounded-full"
            >
              @{user}
            </Button>
          ))}
        </div>

        <Card className="p-6">
          <SearchForm onSearch={setUsername} disabled={isRateLimited} />
          {isRateLimited && (
            <div className="mt-2 text-sm text-red-500">
              Rate limit exceeded. Please wait a moment before trying again.
            </div>
          )}
        </Card>

        {username && (
          <div className="pb-12" ref={ref}>
            <XReceipt username={username} />
          </div>
        )}
      </div>

      {username && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black/75 backdrop-blur-sm rounded-full p-2 flex gap-2">
          <Button
            onClick={handleShare}
            disabled={isSharing || isLoading}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
            variant="ghost"
          >
            {isSharing ? "Copying..." : "Copy image"}
          </Button>
        </div>
      )}
    </div>
  );
}