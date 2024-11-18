import { PropsWithChildren } from 'react';
import { Separator } from './ui/separator';
import Barcode from 'react-barcode';
import { CheckCircle } from 'lucide-react';

type ReceiptLayoutProps = PropsWithChildren<{
  username?: string;
}>;

function TornEdge() {
  return (
    <div className="w-full h-6 overflow-hidden relative">
      <div className="w-full h-12 absolute" style={{
        backgroundImage: `
          radial-gradient(circle at 50% 0%, transparent 12px, white 12px),
          radial-gradient(circle at 50% -5px, rgba(0,0,0,0.1) 12px, transparent 12px)
        `,
        backgroundSize: '24px 24px',
        backgroundPosition: '0 -12px, 12px -12px',
        backgroundRepeat: 'repeat-x',
      }} />
    </div>
  );
}

export function ReceiptLayout({ children, username }: ReceiptLayoutProps) {
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
