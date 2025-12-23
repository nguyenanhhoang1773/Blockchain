import React, { useState, useEffect } from "react";
import axios from "axios";
import { useWeb3 } from "../components/Web3Context";
import { BACKEND_URL } from "../constants";
import {
  User,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Phone,
  Hash,
} from "lucide-react";
import { UserProfile } from "../types";

export default function Profile() {
  const { account, connectWallet } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);

  // Profile display state
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  // Fetch profile when wallet connects
  useEffect(() => {
    if (account) {
      fetchProfile();
    } else {
      setProfileData(null);
      setHasProfile(false);
    }
  }, [account]);

  const fetchProfile = async () => {
    if (!account) return;

    setFetching(true);
    setError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/users/${account}`);
      setProfileData(response.data);
      setHasProfile(true);

      // Populate form with existing data
      setName(response.data.name || "");
      setPhone(response.data.phone || "");
      setIdNumber(response.data.idNumber || "");
      setAvatarUrl(response.data.avatarUrl || "");
      setBackgroundImageUrl(response.data.backgroundImageUrl || "");
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Profile doesn't exist yet
        setHasProfile(false);
        setProfileData(null);
      } else {
        console.error("Error fetching profile:", err);
        setError(
          err.response?.data?.error || err.message || "Failed to fetch profile"
        );
      }
    } finally {
      setFetching(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setBackgroundFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    if (!name || !phone || !idNumber) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Upload images to cloud storage (e.g., AWS S3, Cloudinary) and get URLs
      // For now, using base64 data URLs (not recommended for production)
      const profileData: Partial<UserProfile> = {
        walletAddress: account,
        name,
        phone,
        idNumber,
        avatarUrl: avatarUrl || undefined,
        backgroundImageUrl: backgroundImageUrl || undefined,
      };

      await axios.post(`${BACKEND_URL}/api/users`, profileData);

      setSuccess("Profile saved successfully!");
      await fetchProfile();
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to save profile. Check console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white shadow rounded-lg border border-slate-200 p-8 text-center">
          <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-slate-600 mb-6">
            Please connect your wallet to view or create your profile.
          </p>
          <button
            onClick={connectWallet}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <User className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-slate-900">User Profile</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Display */}
        <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800">
              Your Profile
            </h2>
            <button
              onClick={fetchProfile}
              disabled={fetching}
              className="text-sm text-primary hover:text-indigo-700 disabled:opacity-50"
            >
              {fetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </button>
          </div>

          {fetching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : hasProfile && profileData ? (
            <div className="space-y-4">
              {profileData.backgroundImageUrl && (
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={profileData.backgroundImageUrl}
                    alt="Background"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
              {profileData.avatarUrl && (
                <div className="flex justify-center">
                  <img
                    src={profileData.avatarUrl}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full border-2 border-slate-200"
                  />
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <FileText className="h-4 w-4" />
                    Name
                  </div>
                  <p className="text-slate-900 font-medium">
                    {profileData.name || "-"}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Phone className="h-4 w-4" />
                    Phone
                  </div>
                  <p className="text-slate-900 font-medium">
                    {profileData.phone || "-"}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Hash className="h-4 w-4" />
                    ID Number
                  </div>
                  <p className="text-slate-900 font-medium font-mono text-sm">
                    {profileData.idNumber || "-"}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">
                    Wallet Address
                  </div>
                  <p className="text-xs font-mono text-slate-600 break-all">
                    {profileData.walletAddress}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p>No profile found. Create one using the form.</p>
            </div>
          )}
        </div>

        {/* Profile Form */}
        <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            {hasProfile ? "Update Profile" : "Create Profile"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="+1234567890"
                required
              />
            </div>

            <div>
              <label
                htmlFor="idNumber"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                ID Number *
              </label>
              <input
                type="text"
                id="idNumber"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                placeholder="ID123456"
                required
              />
            </div>

            <div>
              <label
                htmlFor="avatar"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Avatar
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
                <div className="space-y-1 text-center">
                  {avatarUrl ? (
                    <div className="mt-2">
                      <img
                        src={avatarUrl}
                        alt="Avatar Preview"
                        className="mx-auto h-24 w-24 rounded-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarUrl("");
                          setAvatarFile(null);
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                      <div className="flex text-sm text-slate-600">
                        <label
                          htmlFor="avatar-upload"
                          className="relative cursor-pointer rounded-md font-medium text-primary hover:text-indigo-600"
                        >
                          <span>Upload avatar</span>
                          <input
                            id="avatar-upload"
                            name="avatar-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleAvatarChange}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-slate-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="backgroundImage"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Background Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
                <div className="space-y-1 text-center">
                  {backgroundImageUrl ? (
                    <div className="mt-2">
                      <img
                        src={backgroundImageUrl}
                        alt="Preview"
                        className="mx-auto h-32 w-auto rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBackgroundImageUrl("");
                          setBackgroundFile(null);
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                      <div className="flex text-sm text-slate-600">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer rounded-md font-medium text-primary hover:text-indigo-600"
                        >
                          <span>Upload an image</span>
                          <input
                            id="image-upload"
                            name="image-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleBackgroundChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-md text-xs text-slate-600">
              <p className="font-semibold mb-1">ℹ️ Data Storage:</p>
              <p>
                Your profile data is stored in MongoDB (off-chain database).
                Only your wallet address is used to identify your profile.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  {hasProfile ? "Update Profile" : "Create Profile"}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
