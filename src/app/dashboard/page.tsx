import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { emails } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import LogoutButton from './logout-button';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user's emails from database
  const userEmails = await db
    .select()
    .from(emails)
    .where(eq(emails.userId, user.id))
    .orderBy(desc(emails.createdAt))
    .limit(50);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">FWD Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Email History</h2>
          <p className="text-gray-400">Track all your sent emails and their status</p>
        </div>

        {/* Email Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-300 uppercase">To</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-300 uppercase">Subject</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-300 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {userEmails.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No emails sent yet. Use the API to send your first email!
                  </td>
                </tr>
              ) : (
                userEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-white">{email.to}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{email.subject}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={email.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(email.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300',
    processing: 'bg-blue-500/20 text-blue-300',
    completed: 'bg-green-500/20 text-green-300',
    failed: 'bg-red-500/20 text-red-300',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-500/20 text-gray-300'}`}>
      {status}
    </span>
  );
}
