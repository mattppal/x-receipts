import { PropsWithChildren, useEffect, useRef } from "react";
import { Separator } from "./ui/separator";
import { CheckCircle, Link as LinkIcon } from "lucide-react";

type ReceiptLayoutProps = PropsWithChildren<{
  username?: string;
  onDownload?: () => void;
  onDownloadPDF?: () => void;
  onShare?: () => void;
  isVerified?: boolean;
  accountAge?: number;
}>;

function AccountAgeStamp({ years }: { years: number }) {
  return (
    <div className="absolute bottom-16 right-8 transform -rotate-12">
      <div className="border-4 border-red-500 rounded-full w-24 h-24 flex items-center justify-center">
        <div className="text-red-500 flex flex-col items-center">
          <span className="text-2xl font-bold">{years}</span>
          <span className="text-xs font-bold mt-1">YEARS</span>
        </div>
      </div>
    </div>
  );
}

function VerificationStamp({ isVerified }: { isVerified: boolean }) {
  if (isVerified) return null; // Only show stamp when verified is true

  return (
    <div className="absolute top-16 left-8 transform rotate-12">
      <div className="border-4 border-blue-500 rounded-full w-24 h-24 flex items-center justify-center">
        <div className="text-blue-500 flex flex-col items-center">
          <CheckCircle className="w-8 h-8" />
          <span className="text-xs font-bold mt-1">VERIFIED</span>
        </div>
      </div>
    </div>
  );
}

export function ReceiptLayout({
  children,
  onDownload,
  onDownloadPDF,
  onShare,
  isVerified,
  accountAge,
}: ReceiptLayoutProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateShadow = () => {
      if (contentRef.current && wrapperRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        const baseBlur = 8;
        const maxBlur = 24;
        const baseSpread = 4;
        const maxSpread = 12;

        const heightFactor = Math.min(contentHeight / 1000, 1);
        const dynamicBlur = baseBlur + (maxBlur - baseBlur) * heightFactor;
        const dynamicSpread =
          baseSpread + (maxSpread - baseSpread) * heightFactor;

        wrapperRef.current.style.filter = `drop-shadow(0 ${dynamicSpread}px ${dynamicBlur}px rgba(0, 0, 0, ${0.1 + heightFactor * 0.1}))`;
      }
    };

    updateShadow();
    const observer = new ResizeObserver(updateShadow);
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => {
      if (contentRef.current) {
        observer.unobserve(contentRef.current);
      }
    };
  }, []);

  return (
    <div className="flex justify-center items-center py-8">
      <div
        ref={wrapperRef}
        id="receipt-wrapper"
        className="relative bg-white max-w-md w-full mx-auto shadow-lg font-mono text-sm rounded-lg transform rotate-1"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px),
            radial-gradient(circle at center, rgba(0,0,0,0.02) 0%, transparent 100%)
          `,
          backgroundSize: "auto, 100% 100%",
        }}
      >
        <div className="p-8">
          <div ref={contentRef} className="space-y-6" id="receipt">
            {children}
          </div>
        </div>
        <VerificationStamp isVerified={isVerified || false} />
        {accountAge !== undefined && <AccountAgeStamp years={accountAge} />}
      </div>
      {(onDownload || onDownloadPDF || onShare) && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black/75 backdrop-blur-sm rounded-full p-2 flex gap-2">
          {onDownload && (
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
            >
              Download PNG
            </button>
          )}
          {onDownloadPDF && (
            <button
              onClick={onDownloadPDF}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
            >
              Download PDF
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
            >
              Share
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ReceiptLine({
  label,
  value,
  verified,
}: {
  label: string;
  value: string | number;
  verified?: boolean;
}) {
  return (
    <div className="flex justify-between items-start">
      <span className="flex-shrink-0 text-gray-600">{label}</span>
      <span className="text-right ml-4 flex-1 font-bold flex items-center justify-end gap-2">
        {value}
        {verified && label === "VERIFIED:" && (
          <CheckCircle className="w-4 h-4 text-blue-500 inline" />
        )}
      </span>
    </div>
  );
}

export function ReceiptHeader({
  title,
  date,
  orderNumber,
}: {
  title: string;
  date: string;
  orderNumber?: string;
}) {
  return (
    <div className="text-center space-y-2">
      <div className="text-xl font-bold tracking-wider flex items-center justify-center gap-2">
        <svg width="24" height="24" viewBox="0 0 300 300" className="h-8 w-8" aria-hidden="true" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"
          />
        </svg>
        {title}
      </div>
      <div className="text-sm text-gray-600">{date}</div>
      {orderNumber && (
        <div className="text-sm text-gray-500">ORDER #{orderNumber}</div>
      )}
      <Separator className="my-6" />
    </div>
  );
}

export function ReceiptFooter({ 
  text, 
  url, 
  footerLink 
}: { 
  text: string; 
  url?: string;
  footerLink?: React.ReactNode;
}) {
  return (
    <div className="text-center mt-6 pt-6 border-t border-dashed space-y-4">
      {url && (
        <div className="text-sm space-y-1 text-gray-600 flex items-center justify-center gap-1">
          <LinkIcon className="w-4 h-4" />
          {footerLink || (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {url}
            </a>
          )}
        </div>
      )}
      <div className="text-sm font-bold tracking-wider">{text}</div>
    </div>
  );
}