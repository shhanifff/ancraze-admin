"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import Cookies from "js-cookie";
import Loader from "./componets/Loder";

export default function HomePage() {
  const router = useRouter();
  const { user, loading, loginWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const role = Cookies.get("role");
    if (role === "admin") {
      router.push("/dashboard");
      return;
    }

    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFormLoading(true);

    try {
      const res = await loginWithEmail(email, password);
      setSuccess("Login successful! Redirecting...");

      if (res.role === "admin") {
        Cookies.set("role", "admin", { expires: 7 });
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(` ${errorMessage}`);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white p-10 rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#2A0066]">Welcome</h2>
          <p className="mt-2 text-sm text-gray-500">
            login in to manage your ancraze
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              disabled={formLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none transition disabled:bg-gray-50 text-black"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              disabled={formLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A0066] focus:border-transparent outline-none transition disabled:bg-gray-50 text-black"
              required
            />
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-red-600 text-xs font-medium">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={formLoading}
            className="w-full py-3.5 px-4 bg-[#2A0066] hover:opacity-90 text-white font-bold rounded-xl transition duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {formLoading ? "loging..." : "login"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
