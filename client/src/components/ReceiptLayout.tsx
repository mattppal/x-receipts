import { PropsWithChildren } from 'react';
import { Separator } from './ui/separator';

type ReceiptLayoutProps = PropsWithChildren<{
  onDownload?: () => void;
  onDownloadPDF?: () => void;
  onShare?: () => void;
}>;

export function ReceiptLayout({ children, onDownload, onDownloadPDF, onShare }: ReceiptLayoutProps) {
  return (
    <div className="bg-white p-12 max-w-md mx-auto shadow-lg font-mono text-sm rounded-lg" style={{
      backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px)`
    }}>
      <div className="space-y-6" id="receipt">
        {children}
      </div>
      
      <div className="mt-8 flex justify-center gap-4">
        {onDownload && (
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition"
          >
            Download PNG
          </button>
        )}
        {onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition"
          >
            Download PDF
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition"
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
}

export function ReceiptLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-start">
      <span className="flex-shrink-0">{label}</span>
      <span className="text-right ml-4 flex-1">{value}</span>
    </div>
  );
}

export function ReceiptHeader({ title, date }: { title: string; date: string }) {
  return (
    <div className="text-center space-y-2">
      <div className="text-xl font-bold">{title}</div>
      <div className="text-sm">{date}</div>
      <Separator className="my-6" />
    </div>
  );
}

export function ReceiptFooter({ text }: { text: string }) {
  return (
    <div className="text-center mt-6 pt-6 border-t border-dashed">
      <div className="text-sm">{text}</div>
    </div>
  );
}
