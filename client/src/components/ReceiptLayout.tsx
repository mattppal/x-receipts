import { PropsWithChildren, useEffect, useRef } from "react";
import { CheckCircle, Link as LinkIcon } from "lucide-react";
import * as React from "react";
import { twMerge } from "tailwind-merge";
import {Separator} from './ui/separator';

const getTenureColor = (years: number): { border: string; text: string } => {
  if (years < 1) return { border: "border-emerald-400", text: "text-emerald-400" };
  if (years <= 3) return { border: "border-blue-400", text: "text-blue-400" };
  if (years <= 8) return { border: "border-purple-500", text: "text-purple-500" };
  if (years <= 15) return { border: "border-amber-500", text: "text-amber-500" };
  return { border: "border-red-500", text: "text-red-500" };
};

type ReceiptLayoutProps = PropsWithChildren<{
  username: string;
  metrics?: {
    followers: number;
    following: number;
    tweets: number;
  };
  isVerified?: boolean;
  accountAge?: number;
}>;

function AccountAgeStamp({ years }: { years: number }) {
  const colors = getTenureColor(years);
  return (
    <div className="absolute bottom-16 right-8 transform -rotate-12">
      <div className={`border-4 ${colors.border} rounded-full w-24 h-24 flex items-center justify-center`}>
        <div className={`${colors.text} flex flex-col items-center`}>
          <span className="text-2xl font-bold">{years}</span>
          <span className="text-xs font-bold mt-1">YEARS</span>
        </div>
      </div>
    </div>
  );
}

function VerificationStamp({ isVerified }: { isVerified: boolean }) {
  if (isVerified) return null;

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
  username,
  metrics,
  isVerified,
  accountAge,
  children,
  className,
  ...props
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
        const dynamicSpread = baseSpread + (maxSpread - baseSpread) * heightFactor;

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
    <div className={twMerge("flex justify-center items-center py-8", className)}>
      <div
        ref={wrapperRef}
        id="receipt-wrapper"
        className="relative bg-white max-w-md w-full mx-auto shadow-lg font-mono text-sm rounded-lg transform rotate-1"
      >
        <div className="p-8">
          <div ref={contentRef} className="space-y-6" id="receipt">
            {children}
          </div>
        </div>
        <VerificationStamp isVerified={isVerified || false} />
        {accountAge !== undefined && <AccountAgeStamp years={accountAge} />}
      </div>
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
  date,
  orderNumber,
}: {
  date: string;
  orderNumber?: string;
}) {
  return (
    <div className="text-center space-y-2">
      <div className="text-xs text-gray-300 mb-4"><a href="https://x-receipts.replit.app" target="_blank">https://x-receipts.replit.app</a></div>
      <div className="text-xl font-bold tracking-wider flex items-center justify-center gap-2">
        <div className="mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 300 300"
            className="h-8 w-8"
            aria-hidden="true"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"
            />
          </svg>
        </div>
      </div>
      <div className="text-sm text-gray-600">{date}</div>
      {orderNumber && (
        <div className="text-sm text-gray-500">ORDER #{orderNumber}</div>
      )}
      <Separator className="my-4 border-dashed" />
    </div>
  );
}

export function ReceiptFooter({
  text,
  url,
  footerLink,
}: {
  text: string;
  url?: string;
  footerLink?: React.ReactNode;
}) {
  return (
    <div className="text-center space-y-4">
      <Separator className="my-4 border-dashed" />
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
