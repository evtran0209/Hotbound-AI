"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [product, setProduct] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // Check for existing profile data
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      const { role, company, product } = JSON.parse(savedProfile);
      setRole(role);
      setCompany(company);
      setProduct(product);
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Store profile data in localStorage
      const profileData = { role, company, product };
      localStorage.setItem("userProfile", JSON.stringify(profileData));

      // Navigate to persona search page
      router.push("/persona-search");
    } catch (error) {
      setError("Failed to save profile data");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Your Sales Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., SDR, Account Executive"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Your Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., Acme Corp"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Your Product/Service
            </label>
            <textarea
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 h-24"
              placeholder="Describe your product or service..."
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          >
            {isLoading ? "Saving..." : "Continue to Persona Search"}
          </button>
        </form>
      </div>
    </div>
  );
}