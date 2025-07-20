'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. It might have been moved, 
            deleted, or you entered the wrong URL.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" passHref>
              <a className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300">
                Go Home
              </a>
            </Link>
            <Link href="/dashboard" passHref>
              <a className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors duration-300">
                Go to Dashboard
              </a>
            </Link>
          </div>

          <div className="mt-8 text-gray-500">
            <p>Or try one of these popular pages:</p>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Link href="/about" passHref>
                <a className="text-blue-600 hover:text-blue-800 underline">About Us</a>
              </Link>
              <Link href="/dashboard" passHref>
                <a className="text-blue-600 hover:text-blue-800 underline">Dashboard</a>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
