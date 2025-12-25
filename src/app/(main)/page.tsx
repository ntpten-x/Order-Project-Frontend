"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { User } from "@/types/api/users";

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`/api/users/delete/${id}`);
      setUsers(users.filter((u) => u.id !== id));
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert(error.response?.data?.error || "Failed to delete user");
    }
  };

  useEffect(() => {

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/users/getAll");
        setUsers(response.data);
        setError(null);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to load users. Please try again later.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);
  return (
    <div className="min-h-screen bg-white text-black selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
              O
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500">
              OrderSystem
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              href="/login" 
              className="text-sm font-medium hover:text-blue-500 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New: Role-based Access Control
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8">
            Manage Orders with <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">
              Precision & Speed
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 mb-12 leading-relaxed">
            A powerful, secure, and modern order management system built for high-performance teams. 
            Automate your workflow and focus on what matters most.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
            >
              Create Free Account
            </Link>
            <Link 
              href="/docs" 
              className="w-full sm:w-auto px-8 py-4 bg-gray-100 hover:bg-gray-200 rounded-2xl font-bold text-lg transition-all"
            >
              View Documentation
            </Link>
          </div>

          <div className="mt-20">
            <h2 className="text-3xl font-bold mb-10 text-left">Active Users</h2>
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-red-600">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {users.map((user) => (
                  <div 
                    key={user.id}
                    className="p-6 bg-white border border-gray-100 rounded-2xl text-left hover:border-blue-500/50 transition-all group shadow-sm"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-xl font-bold mb-4">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-bold mb-1 truncate">{user.username}</h3>
                    <p className="text-gray-500 text-sm">User ID: {user.id}</p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                       <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-600">
                         Active
                       </span>
                       <div className="flex items-center gap-2">
                         <span className="text-xs text-gray-400">
                           {user.roles?.display_name || "Member"}
                         </span>
                         <button
                           onClick={() => handleDelete(user.id)}
                           className="text-red-500 hover:text-red-700 transition-colors p-1"
                           title="Delete User"
                         >
                           🗑️
                         </button>
                       </div>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="col-span-full py-20 text-center text-gray-500">
                    No users found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
            {[
              {
                title: "Role Management",
                desc: "Granular access control for users and administrators.",
                icon: "🔒"
              },
              {
                title: "Real-time Stats",
                desc: "Monitor your operations with live data visualization.",
                icon: "📈"
              },
              {
                title: "Secure API",
                desc: "Enterprise-grade security for all your data transactions.",
                icon: "🛡️"
              }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="p-8 bg-white border border-gray-100 rounded-3xl text-left hover:border-blue-500/50 transition-all group shadow-sm"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm">
            © 2025 OrderSystem. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link href="#" className="text-sm text-gray-500 hover:text-blue-500">Privacy</Link>
            <Link href="#" className="text-sm text-gray-500 hover:text-blue-500">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

