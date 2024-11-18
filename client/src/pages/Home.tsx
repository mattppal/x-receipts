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
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <svg width="32" height="32" viewBox="0 0 300 300" className="h-10 w-10" aria-hidden="true" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="currentColor"
                d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"
              />
            </svg>
            Receipt
          </h1>
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
