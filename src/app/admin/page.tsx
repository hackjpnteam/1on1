"use client";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const { data: users, mutate } = useSWR("/api/users");
  const router = useRouter();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    bio: "",
    expertise: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // 管理者権限チェック
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const currentUser = users?.find((u: any) => u.email === session.user?.email);
  if (currentUser?.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h1 className="text-xl font-bold text-red-800">アクセス権限がありません</h1>
          <p className="text-red-600">この機能は管理者のみ利用できます。</p>
        </div>
      </div>
    );
  }

  const startEdit = (user: any) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "",
      department: user.department || "",
      bio: user.bio || "",
      expertise: user.expertise?.join(", ") || "",
    });
    setImageFile(null);
    setImagePreview("");
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

  const handleSave = async () => {
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
          email: editingUser.email,
          name: editForm.name,
          role: editForm.role,
          department: editForm.department,
          bio: editForm.bio,
          expertise: editForm.expertise.split(",").map(s => s.trim()).filter(Boolean),
          ...(imageUrl && { image: imageUrl }),
        }),
      });

      if (response.ok) {
        alert("プロフィールを更新しました");
        setEditingUser(null);
        setImageFile(null);
        setImagePreview("");
        mutate(); // データを再取得
      } else {
        const data = await response.json();
        alert(data.error || "エラーが発生しました");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ユーザー管理 (管理者)</h1>
        <Link
          href="/profile"
          className="px-4 py-2 text-orange-600 border border-orange-600 rounded-md hover:bg-orange-50 transition-colors"
        >
          プロフィールに戻る
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-soft border border-orange-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
          <h2 className="text-lg font-semibold text-orange-800">全ユーザー一覧</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  役割
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  部署
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メンター
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users?.map((user: any) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={user.image || `https://i.pravatar.cc/40?u=${user.email}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === "admin" ? "bg-red-100 text-red-800" :
                      user.role === "manager" ? "bg-blue-100 text-blue-800" :
                      user.role === "mentor" ? "bg-orange-100 text-orange-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {user.role === "admin" ? "管理者" :
                       user.role === "manager" ? "マネージャー" :
                       user.role === "mentor" ? "メンター" : "メンバー"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.department || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isMentor ? (
                      <span className="text-green-600 text-sm">✓</span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => startEdit(user)}
                      className="text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 編集モーダル */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">ユーザー編集: {editingUser.name}</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">プロフィール写真</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={imagePreview || editingUser?.image || `https://i.pravatar.cc/80?u=${editingUser?.email}`}
                      alt={editingUser?.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <label
                      htmlFor="admin-image-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <span className="text-white text-xs">変更</span>
                      <input
                        id="admin-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex flex-col gap-2">
                    {imageFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        選択解除
                      </button>
                    )}
                    {editingUser?.image && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/profile", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                email: editingUser.email,
                                image: null,
                              }),
                            });
                            
                            if (response.ok) {
                              alert("プロフィール写真を削除しました");
                              mutate();
                              setEditingUser({ ...editingUser, image: null });
                            } else {
                              alert("削除に失敗しました");
                            }
                          } catch (error) {
                            console.error("Error:", error);
                            alert("エラーが発生しました");
                          }
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        写真を削除
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">役割</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="member">メンバー</option>
                  <option value="mentor">メンター</option>
                  <option value="manager">マネージャー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部署</label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">専門分野</label>
                <input
                  type="text"
                  value={editForm.expertise}
                  onChange={(e) => setEditForm({ ...editForm, expertise: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="カンマ区切りで入力"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-md hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all duration-200"
              >
                {loading ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}