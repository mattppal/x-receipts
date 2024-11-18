import { PropsWithChildren, useEffect, useRef, useState, useMemo } from "react";
import { Separator } from "./ui/separator";
import { CheckCircle, Link as LinkIcon } from "lucide-react";

type ReceiptLayoutProps = PropsWithChildren<{
  username?: string;
  onDownload?: () => void;
  onDownloadPDF?: () => void;
  onShare?: () => void;
  isVerified?: boolean;
}>;

function VerificationStamp({ isVerified }: { isVerified: boolean }) {
  if (isVerified) return null;

  return (
    <div className="absolute top-24 right-8 transform rotate-12">
      <div className="border-4 border-blue-500 rounded-full w-24 h-24 flex items-center justify-center">
        <div className="text-blue-500 flex flex-col items-center">
          <CheckCircle className="w-8 h-8" />
          <span className="text-xs font-bold mt-1">VERIFIED</span>
        </div>
      </div>
    </div>
  );
}

function TornEdge({ isUnder = false }: { isUnder?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const tearSize = 12; // Slightly larger tears
  const tearVariation = 2; // Amount of random variation

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setWidth(entry.contentRect.width);
        }
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const tiles = Math.ceil(width / tearSize);
  const rawTiles = width / tearSize;
  const offset = ((tiles - rawTiles) * tearSize) / 2;
  const margin = -(tearSize * 1.5) / 2;

  // Generate random offsets for each tear
  const randomOffsets = useMemo(() => {
    return Array(tiles).fill(0).map(() => 
      (Math.random() * tearVariation) - (tearVariation / 2)
    );
  }, [tiles]);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{
        height: tearSize * 1.5,
        marginTop: isUnder ? margin : 0,
        marginBottom: isUnder ? 0 : margin,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        zIndex: 0,
      }}
    >
      {/* Left end cap */}
      <div
        style={{
          width: tearSize,
          height: tearSize * 1.5,
          backgroundColor: "white",
          marginRight: -offset,
          zIndex: 100,
          borderRadius: isUnder ? "0 0 2px 2px" : "2px 2px 0 0",
          boxShadow: isUnder ? "inset 0 1px 3px rgba(0,0,0,0.1)" : "inset 0 -1px 3px rgba(0,0,0,0.1)",
        }}
      />
      
      {/* Tear elements */}
      {Array.from({ length: tiles }).map((_, i) => (
        <div
          key={`tear-${i}`}
          style={{
            width: tearSize,
            height: tearSize,
            backgroundColor: "white",
            transform: `rotate(45deg) translateY(${randomOffsets[i]}px)`,
            position: "relative",
            zIndex: 1,
            boxShadow: isUnder 
              ? "inset -1px -1px 2px rgba(0,0,0,0.05)"
              : "inset 1px 1px 2px rgba(0,0,0,0.05)",
          }}
        />
      ))}
      
      {/* Right end cap */}
      <div
        style={{
          width: tearSize,
          height: tearSize * 1.5,
          backgroundColor: "white",
          marginLeft: -offset,
          zIndex: 100,
          borderRadius: isUnder ? "0 0 2px 2px" : "2px 2px 0 0",
          boxShadow: isUnder ? "inset 0 1px 3px rgba(0,0,0,0.1)" : "inset 0 -1px 3px rgba(0,0,0,0.1)",
        }}
      />
      
      {/* Paper texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
          backgroundSize: "100px 100px",
          opacity: 0.5,
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}

export function ReceiptLayout({
  children,
  onDownload,
  onDownloadPDF,
  onShare,
  isVerified,
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

        // Calculate dynamic shadow values based on content height
        const heightFactor = Math.min(contentHeight / 1000, 1); // Normalize height
        const dynamicBlur = baseBlur + (maxBlur - baseBlur) * heightFactor;
        const dynamicSpread =
          baseSpread + (maxSpread - baseSpread) * heightFactor;

        // Update the shadow style
        wrapperRef.current.style.filter = `drop-shadow(0 ${dynamicSpread}px ${dynamicBlur}px rgba(0, 0, 0, ${0.1 + heightFactor * 0.1}))`;
      }
    };

    updateShadow();
    // Add resize observer to update shadow when content changes
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
        className="relative bg-white max-w-md w-full mx-auto shadow-lg font-mono text-sm rounded-lg transform rotate-1"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px),
            radial-gradient(circle at center, rgba(0,0,0,0.02) 0%, transparent 100%)
          `,
          backgroundSize: "auto, 100% 100%",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
            mixBlendMode: "multiply",
          }}
        />
        <TornEdge isUnder={true} />
        <div className="p-8">
          <div ref={contentRef} className="space-y-6" id="receipt">
            {children}
          </div>
        </div>
        <VerificationStamp isVerified={isVerified || false} />
        <div className="rotate-180">
          <TornEdge />
        </div>
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
      <div className="text-xl font-bold tracking-wider">{title}</div>
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
}: {
  text: string;
  url?: string;
}) {
  return (
    <div className="text-center mt-6 pt-6 border-t border-dashed space-y-4">
      {url && (
        <div className="text-sm space-y-1 text-gray-600 flex items-center justify-center gap-1">
          <LinkIcon className="w-4 h-4" />
          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {url}
          </a>
        </div>
      )}
      <div className="text-sm font-bold tracking-wider">{text}</div>
    </div>
  );
}