import { PropsWithChildren } from 'react';
import { Separator } from './ui/separator';
import Barcode from 'react-barcode';

type ReceiptLayoutProps = PropsWithChildren<{
  username?: string;
}>;

export function ReceiptLayout({ children, username }: ReceiptLayoutProps) {
  return (
    <div className="flex justify-center items-center py-8">
      <div 
        className="bg-white p-8 max-w-md mx-auto shadow-lg font-mono text-sm rounded-lg transform rotate-1" 
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px)`,
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
        }}
      >
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
    </div>
  );
}

export function ReceiptLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-start">
      <span className="flex-shrink-0 text-gray-600">{label}</span>
      <span className="text-right ml-4 flex-1 font-bold">{value}</span>
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
