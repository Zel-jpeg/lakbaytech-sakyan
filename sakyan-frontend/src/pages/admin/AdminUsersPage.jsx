import { useState } from 'react'
import { useAdminUsers } from '@/hooks/useAdmin'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { format } from 'date-fns'

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState('')
  const { data, isLoading, isError } = useAdminUsers(roleFilter)
  const users = data?.results || data || []
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Users</h1>
          <p className="text-gray-500 dark:text-gray-400">View and filter all registered users</p>
        </div>
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white dark:bg-[#1a1d2e] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 outline-none"
        >
          <option value="">All Roles</option>
          <option value="customer">Customers</option>
          <option value="partner">Partners</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact Detail</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Spinner size="md" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-red-500 dark:text-red-400">
                    Failed to load users.
                  </td>
                </tr>
              ) : users?.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users?.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar url={user.avatar_url} name={user.full_name} size="md" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[120px] truncate" title={user.id}>
                            ID: {user.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white">{user.email}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{user.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={
                          user.role === 'admin' ? 'purple' : 
                          user.role === 'partner' ? 'blue' : 'gray'
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
