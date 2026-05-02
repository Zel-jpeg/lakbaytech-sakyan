import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, User, Phone, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const { registerMutation, loginWithGoogle } = useAuth()
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirmPassword: '',
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { alert('Passwords do not match'); return }
    registerMutation.mutate({
      full_name: form.full_name, email: form.email, phone: form.phone, password: form.password,
    })
  }

  const inputIcon = (Icon) => (
    <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-lg dark:shadow-xl dark:shadow-black/20
                        border border-gray-100 dark:border-gray-800 p-8">

          <div className="text-center mb-8">
            <Link to="/">
              <img src="/sakyan-logo.png" alt="Sakyan" className="h-8 mx-auto mb-3" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Start renting or listing cars</p>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                {inputIcon(User)}
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange}
                       required className="input-modern pl-10" placeholder="Juan dela Cruz" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                {inputIcon(Mail)}
                <input type="email" name="email" value={form.email} onChange={handleChange}
                       required className="input-modern pl-10" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phone <span className="text-gray-400 dark:text-gray-500">(optional)</span>
              </label>
              <div className="relative">
                {inputIcon(Phone)}
                <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                       className="input-modern pl-10" placeholder="09xxxxxxxxx" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                {inputIcon(Lock)}
                <input type="password" name="password" value={form.password} onChange={handleChange}
                       required className="input-modern pl-10" placeholder="••••••••" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                {inputIcon(Lock)}
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                       required className="input-modern pl-10" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={registerMutation.isPending}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold
                         transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm
                         shadow-sm hover:shadow-md active:scale-[0.98]">
              <UserPlus size={16} />
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}