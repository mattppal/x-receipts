import { PropsWithChildren } from 'react';
import { Separator } from './ui/separator';
import Barcode from 'react-barcode';
import { CheckCircle } from 'lucide-react';

type ReceiptLayoutProps = PropsWithChildren<{
  username?: string;
  onDownload?: () => void;
  onDownloadPDF?: () => void;
  onShare?: () => void;
}>;

function TornEdge() {
  return (
    <div className="w-full h-8 overflow-hidden relative">
      <div className="w-full h-16 absolute" style={{
        backgroundImage: `
          radial-gradient(circle at 50% 0%, transparent 15px, white 15px),
          radial-gradient(circle at 50% -5px, rgba(0,0,0,0.1) 15px, transparent 15px),
          radial-gradient(circle at 25% 0%, transparent 12px, white 12px),
          radial-gradient(circle at 75% 0%, transparent 12px, white 12px),
          linear-gradient(90deg, rgba(0,0,0,0.05) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)
        `,
        backgroundSize: '30px 30px, 30px 30px, 30px 30px, 30px 30px, 100% 100%',
        backgroundPosition: '0 -15px, 15px -15px, -7.5px -15px, 22.5px -15px, 0 0',
        backgroundRepeat: 'repeat-x, repeat-x, repeat-x, repeat-x, no-repeat',
      }} />
    </div>
  );
}

export function ReceiptLayout({ children, username, onDownload, onDownloadPDF, onShare }: ReceiptLayoutProps) {
  return (
    <div className="flex justify-center items-center py-8">
      <div 
        className="relative bg-white max-w-md mx-auto shadow-lg font-mono text-sm rounded-lg transform rotate-1" 
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px),
            radial-gradient(circle at center, rgba(0,0,0,0.02) 0%, transparent 100%)
          `,
          backgroundSize: 'auto, 100% 100%',
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          mixBlendMode: 'multiply'
        }} />
        <TornEdge />
        <div className="p-8">
          <div className="space-y-6" id="receipt">
            {children}
            
            {username && (
              <div className="mt-8 pt-4 border-t border-dashed text-center">
                <div className="flex justify-center mt-4">
                  <Barcode 
                    value={`github.com/${username}`}
                    width={1.5}
                    height={50}
                    fontSize={12}
                    margin={0}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
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

export function ReceiptLine({ label, value, verified }: { label: string; value: string | number; verified?: boolean }) {
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

export function ReceiptHeader({ title, date, orderNumber }: { title: string; date: string; orderNumber?: string }) {
  return (
    <div className="text-center space-y-2">
      <div className="text-xl font-bold tracking-wider">{title}</div>
      <div className="text-sm text-gray-600">{date}</div>
      {orderNumber && <div className="text-sm text-gray-500">ORDER #{orderNumber}</div>}
      <Separator className="my-6" />
    </div>
  );
}

export function ReceiptFooter({ text, cardInfo }: { text: string; cardInfo?: { cardNumber: string; authCode: string; cardHolder: string } }) {
  return (
    <div className="text-center mt-6 pt-6 border-t border-dashed space-y-4">
      {cardInfo && (
        <div className="text-sm space-y-1 text-gray-600">
          <div>CARD #: {cardInfo.cardNumber}</div>
          <div>AUTH CODE: {cardInfo.authCode}</div>
          <div>CARDHOLDER: {cardInfo.cardHolder}</div>
        </div>
      )}
      <div className="text-sm font-bold tracking-wider">{text}</div>
    </div>
  );
}
