"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    expertise: "",
    department: "",
    role: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserData();
    }
  }, [session]);

  useEffect(() => {
    const syncStatus = searchParams.get("sync");
    const error = searchParams.get("error");
    
    if (syncStatus === "success") {
      alert("Googleカレンダーとの同期が完了しました！");
      router.replace("/profile");
    } else if (error) {
      alert(`エラーが発生しました: ${error}`);
      router.replace("/profile");
    }
  }, [searchParams, router]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/users");
      const users = await response.json();
      const currentUser = users.find((u: any) => u.email === session?.user?.email);
      if (currentUser) {
        setUserData(currentUser);
        setFormData({
          name: currentUser.name || "",
          bio: currentUser.bio || "",
          expertise: currentUser.expertise?.join(", ") || "",
          department: currentUser.department || "",
          role: currentUser.role || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      let imageUrl = "";
      
      // Upload image if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        
        const imageResponse = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.url;
        }
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          name: formData.name,
          bio: formData.bio,
          expertise: formData.expertise.split(",").map(s => s.trim()).filter(Boolean),
          department: formData.department,
          role: formData.role,
          ...(imageUrl && { image: imageUrl }),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("プロフィールを更新しました");
        setIsEditing(false);
        setImageFile(null);
        setImagePreview("");
        fetchUserData();
      } else {
        alert(data.error || "エラーが発生しました");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCalendar = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile/sync-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.googleAuthUrl) {
          alert("Googleカレンダーと同期します。認証画面にリダイレクトします。");
          window.location.href = data.googleAuthUrl;
        } else {
          alert("カレンダーの同期が完了しました！");
          fetchUserData();
        }
      } else {
        alert(data.error || "エラーが発生しました");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeMentor = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          bio: formData.bio,
          expertise: formData.expertise.split(",").map(s => s.trim()).filter(Boolean),
          department: formData.department,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.googleAuthUrl) {
          alert("Googleカレンダーと同期します。認証画面にリダイレクトします。");
          window.location.href = data.googleAuthUrl;
        } else {
          alert("メンターとして登録されました！");
          fetchUserData();
        }
      } else {
        alert(data.error || "エラーが発生しました");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">読み込み中...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">プロフィール</h1>

      <div className="bg-white rounded-lg shadow-soft border border-orange-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={imagePreview || userData?.image || session.user?.image || `https://i.pravatar.cc/100?u=${session.user?.email}`}
                alt={session.user?.name || ""}
                className="w-20 h-20 rounded-full object-cover"
              />
              {isEditing && (
                <label
                  htmlFor="image-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                >
                  <span className="text-white text-xs">変更</span>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-xl font-semibold border-b border-gray-300 focus:border-orange-500 focus:outline-none bg-transparent"
                  placeholder="名前"
                />
              ) : (
                <h2 className="text-xl font-semibold">{userData?.name || session.user?.name}</h2>
              )}
              <p className="text-gray-600">{session.user?.email}</p>
              {userData && (
                <p className="text-sm text-gray-500 mt-1">
                  役割: {userData.role === "admin" ? "管理者" : userData.role === "manager" ? "マネージャー" : userData.role === "mentor" ? "メンター" : "メンバー"}
                  {userData.isMentor && " (メンター)"}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-orange-600 border border-orange-600 rounded-md hover:bg-orange-50 transition-colors"
              >
                編集
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: userData?.name || "",
                      bio: userData?.bio || "",
                      expertise: userData?.expertise?.join(", ") || "",
                      department: userData?.department || "",
                      role: userData?.role || "",
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-md hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? "保存中..." : "保存"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* プロフィール情報の表示/編集 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              部署
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="例: エンジニアリング部"
              />
            ) : (
              <p className="text-gray-900">{userData?.department || "未設定"}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              役割
            </label>
            {isEditing ? (
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 transition-colors"
              >
                <option value="">選択してください</option>
                <option value="member">メンバー</option>
                <option value="mentor">メンター</option>
                <option value="manager">マネージャー</option>
                <option value="admin">管理者</option>
              </select>
            ) : (
              <p className="text-gray-900">
                {userData?.role === "admin" ? "管理者" : 
                 userData?.role === "manager" ? "マネージャー" : 
                 userData?.role === "mentor" ? "メンター" : 
                 userData?.role === "member" ? "メンバー" : "未設定"}
                {userData?.isMentor && userData?.role !== "mentor" && " (メンター権限あり)"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              自己紹介
            </label>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="自己紹介を入力してください"
              />
            ) : (
              <p className="text-gray-900">{userData?.bio || "未設定"}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              専門分野
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="キャリア開発, 技術指導, プロジェクト管理（カンマ区切り）"
              />
            ) : (
              <div>
                {userData?.expertise?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userData.expertise.map((exp: string, idx: number) => (
                      <span key={idx} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-sm">
                        {exp}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-900">未設定</p>
                )}
              </div>
            )}
          </div>
        </div>

        {!userData?.isMentor && userData?.role !== "mentor" && !isEditing && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">メンターになる</h3>
            <p className="text-gray-600 mb-4">
              メンターとして登録すると、他のユーザーから1on1の予約を受けることができます。
              Googleカレンダーと連携して、自動的に空き時間を管理します。
            </p>

            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
              <p className="text-sm text-orange-800">
                <strong>メンター登録の流れ：</strong><br/>
                1. 上記の「編集」ボタンからプロフィール情報を入力<br/>
                2. 「メンターとして登録」ボタンをクリック<br/>
                3. Googleカレンダーと連携して予約可能時間を自動同期
              </p>
            </div>

            <button
              onClick={handleBecomeMentor}
              disabled={loading || !formData.bio || !formData.expertise}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-4 rounded-md hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "処理中..." : "メンターとして登録（Googleカレンダー連携）"}
            </button>
            
            {(!formData.bio || !formData.expertise) && (
              <p className="text-sm text-yellow-600 mt-2">
                ※ メンター登録には自己紹介と専門分野の入力が必要です
              </p>
            )}
          </div>
        )}

        {userData?.isMentor && !isEditing && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">メンター情報</h3>
              <button
                onClick={handleSyncCalendar}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm rounded-md hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
              >
                {loading ? "同期中..." : "📅 カレンダー再同期"}
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Googleカレンダー:</span>
                  <p className="text-gray-900">
                    {userData.googleCalendarId ? "✅ 連携済み" : "❌ 未連携"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">予約可能枠:</span>
                  <p className="text-gray-900">
                    {userData.availableSlots?.length || 0} 枠
                  </p>
                </div>
              </div>
              
              {userData.availableSlots?.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700 text-sm">今週の予約可能時間:</span>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {userData.availableSlots.slice(0, 6).map((slot: any, idx: number) => (
                      <div key={idx} className="bg-green-50 border border-green-200 rounded p-2">
                        <div className="font-medium">
                          {["日", "月", "火", "水", "木", "金", "土"][slot.dayOfWeek]}曜日
                        </div>
                        <div className="text-gray-600">
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!userData.googleCalendarId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    Googleカレンダーと連携していません。「カレンダー再同期」ボタンから連携してください。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 管理者のみ管理ページへのリンク */}
        {userData?.role === "admin" && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">管理機能</h3>
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md hover:from-red-600 hover:to-red-700 transition-all duration-200"
            >
              ユーザー管理
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}