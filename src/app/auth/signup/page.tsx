"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Terminal } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/auth/login?registered=1");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <Terminal size={18} className="text-zinc-400" />
          <span className="text-base font-semibold font-mono text-zinc-100">taskify</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h1 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-1">Create account</h1>
          <p className="text-xs text-zinc-500 mb-6">First registered user becomes <span className="text-purple-400 font-mono">ADMIN</span></p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Name" type="text" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            {error && <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/30 rounded px-3 py-2">{error}</p>}
            <Button type="submit" loading={loading} className="w-full mt-1">Create account</Button>
          </form>
        </div>
        <p className="text-center text-xs text-zinc-600 mt-4">
          Have an account?{" "}
          <Link href="/auth/login" className="text-zinc-400 hover:text-zinc-200 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
