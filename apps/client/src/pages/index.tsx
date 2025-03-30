import React from 'react';
import Head from 'next/head';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>EZPG Payment Integration</title>
        <meta name="description" content="Virtual account payment integration with EZPG" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          EZPG Payment Integration
        </h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Virtual account deposits</li>
            <li>Point balance management</li>
            <li>Withdrawal requests to bank accounts</li>
            <li>Transaction history</li>
          </ul>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              This is a demonstration of integration with the EZPG payment gateway.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 