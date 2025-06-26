import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <Link 
        href="/"
        className="text-3xl font-bold mb-12 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600"
      >
        Wonder
      </Link>
      
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Create Your Account
        </h1>
        
        <AuthForm mode="signup" />
        
        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{' '}
          <Link 
            href="/login"
            className="font-medium text-purple-600 hover:text-purple-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
