import { useState } from 'react';
import { SearchForm } from '../components/SearchForm';
import { TwitterReceipt } from '../components/TwitterReceipt';
import { Card } from '../components/ui/card';

export default function Home() {
  const [username, setUsername] = useState<string>('');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">X Receipt</h1>
          <p className="text-gray-600">
            Generate a receipt-style summary of your X profile
          </p>
        </div>

        <Card className="p-6">
          <SearchForm onSearch={setUsername} />
        </Card>

        {username && (
          <div className="mt-8">
            <TwitterReceipt username={username} />
          </div>
        )}
      </div>
    </div>
  );
}
