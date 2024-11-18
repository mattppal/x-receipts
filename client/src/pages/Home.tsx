import { useState } from 'react';
import { SearchForm } from '../components/SearchForm';
import { XReceipt } from '../components/XReceipt';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Home() {
  const [username, setUsername] = useState<string>('');

  const demoUsers = ['elonmusk', 'amasad', 'sama'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">X Receipt</h1>
          <p className="text-gray-600">
            Generate a receipt-style summary of your X profile
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
          <SearchForm onSearch={setUsername} />
        </Card>

        {username && (
          <div className="mt-8">
            <XReceipt username={username} />
          </div>
        )}
      </div>
    </div>
  );
}
