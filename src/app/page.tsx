'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import ProtectedLayout from '@/components/ProtectedLayout';

export default function Home() {
  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          <header className="text-center mb-16">
            <motion.h1 
              className="text-5xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Tweet Bookmarks
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-500 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Categorize and organize your Twitter bookmarks with AI
            </motion.p>
          </header>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/fetch" className="block">
              <motion.div 
                className="bg-gray-900 border border-gray-800 rounded-xl p-8 h-full transition-all hover:border-fuchsia-900"
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center mb-6 border border-gray-800">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-8 h-8 text-fuchsia-400"
                  >
                    <path d="M11.9997 2C6.47976 2 2.00049 6.48 2.00049 12C2.00049 17.52 6.47976 22 11.9997 22C17.5197 22 21.9997 17.52 21.9997 12C21.9997 6.48 17.5197 2 11.9997 2ZM18.9197 8H15.9697C15.6497 6.75 15.1997 5.55 14.6297 4.44C16.4397 5.07 17.9197 6.35 18.9197 8ZM11.9997 4.04C12.8297 5.24 13.4797 6.57 13.9097 8H10.0897C10.5197 6.57 11.1697 5.24 11.9997 4.04ZM4.25976 14C4.09976 13.36 3.99976 12.69 3.99976 12C3.99976 11.31 4.09976 10.64 4.25976 10H7.63976C7.55976 10.66 7.49976 11.32 7.49976 12C7.49976 12.68 7.55976 13.34 7.63976 14H4.25976ZM5.07976 16H8.02976C8.34976 17.25 8.79976 18.45 9.36976 19.56C7.55976 18.93 6.07976 17.66 5.07976 16ZM8.02976 8H5.07976C6.07976 6.34 7.55976 5.07 9.36976 4.44C8.79976 5.55 8.34976 6.75 8.02976 8Z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-3">Fetch Tweets</h2>
                <p className="text-gray-400 mb-6">
                  Import your Twitter bookmarks and automatically categorize them with AI
                </p>
                <div className="flex items-center text-fuchsia-400 font-medium">
                  <span>Get started</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-5 h-5 ml-2"
                  >
                    <path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z"/>
                  </svg>
                </div>
              </motion.div>
            </Link>
            
            <Link href="/stock" className="block">
              <motion.div 
                className="bg-gray-900 border border-gray-800 rounded-xl p-8 h-full transition-all hover:border-emerald-900"
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center mb-6 border border-gray-800">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-8 h-8 text-emerald-400"
                  >
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7zm-4 6h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-3">Tweet Stock</h2>
                <p className="text-gray-400 mb-6">
                  Browse your organized tweet collection by categories and search through your tweets
                </p>
                <div className="flex items-center text-emerald-400 font-medium">
                  <span>View collection</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-5 h-5 ml-2"
                  >
                    <path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z"/>
                  </svg>
                </div>
              </motion.div>
            </Link>
          </motion.div>
          
          <motion.div 
            className="mt-12 text-center text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <p>Save and organize your favorite tweets with AI-powered categorization</p>
          </motion.div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
