import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, LogIn } from 'lucide-react'

export default function LoginPage() {
  const { loginMutation, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    loginMutation.mutate({ email, password })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20
                        border border-gray-100 dark:border-gray-800 p-8">

          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/">
              <img src="/sakyan-logo.png" alt="Sakyan" className="h-8 mx-auto mb-3" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Sign in to your account</p>
          </div>

          {/* Google Login */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 dark:border-gray-700
                       rounded-xl py-3 mb-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition
                       text-gray-700 dark:text-gray-300"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
            <span className="font-medium">Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 mb-6">
            <hr className="flex-1 border-gray-200 dark:border-gray-700" />
            <span className="text-gray-400 dark:text-gray-500 text-sm">or</span>
            <hr className="flex-1 border-gray-200 dark:border-gray-700" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-modern pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-modern pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold
                         transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm
                         shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <LogIn size={16} />
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6 space-y-2">
            <p>
              <Link to="/forgot-password" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
                Forgot your password?
              </Link>
            </p>
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}