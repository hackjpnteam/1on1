"use client";
import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";

export default function PeoplePage() {
  const { data: users, isLoading: usersLoading } = useSWR("/api/users");
  const { data: pairs, isLoading: pairsLoading } = useSWR("/api/pairs");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState("");

  // 予約可能なメンター（マネージャー・管理者・メンター）
  const bookableUsers = users?.filter((u: any) => 
    u.role === "manager" || u.role === "admin" || u.role === "mentor" || u.isMentor
  ) || [];
  

  // フィルタリング
  const filteredUsers = bookableUsers.filter((user: any) => {
    const matchesDept = !departmentFilter || user.department === departmentFilter;
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesExpertise = !expertiseFilter || 
      user.expertise?.some((exp: string) => 
        exp.toLowerCase().includes(expertiseFilter.toLowerCase())
      );
    return matchesDept && matchesRole && matchesExpertise;
  });

  // 部署一覧
  const departments = [...new Set(users?.map((u: any) => u.department).filter(Boolean))] as string[];
  
  // 専門分野一覧（全ユーザーの専門分野を集約）
  const allExpertise = [...new Set(
    bookableUsers
      ?.flatMap((u: any) => u.expertise || [])
      .filter(Boolean)
  )] as string[];

  // 各人物の統計情報を取得
  const getUserStats = (userId: string) => {
    const userPairs = pairs?.filter((p: any) => p.managerId._id === userId) || [];
    return {
      totalMentees: userPairs.length,
      activePairs: userPairs.filter((p: any) => p.active).length
    };
  };

  if (usersLoading || pairsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">予約可能なメンター</h1>
        <Link 
          href="/schedule"
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl hover:from-orange-600 hover:to-orange-700 text-sm shadow-md transition-all duration-200"
        >
          1on1を予約
        </Link>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-2xl shadow-soft border border-orange-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">部署</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">すべて</option>
              {departments.map((dept: string) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">役職</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">すべて</option>
              <option value="admin">管理者</option>
              <option value="manager">マネージャー</option>
              <option value="mentor">メンター</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">専門分野</label>
            <select
              value={expertiseFilter}
              onChange={(e) => setExpertiseFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">すべて</option>
              {allExpertise.map((expertise: string) => (
                <option key={expertise} value={expertise}>{expertise}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setDepartmentFilter("");
                setRoleFilter("");
                setExpertiseFilter("");
              }}
              className="w-full px-4 py-2 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors text-sm"
            >
              フィルターをクリア
            </button>
          </div>
        </div>
      </div>

      {/* 人物一覧 */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 md:gap-6">
        {filteredUsers.map((person: any) => {
          const stats = getUserStats(person._id);
          return (
            <div
              key={person._id}
              className="bg-white rounded-2xl border border-orange-100 shadow-soft hover:shadow-soft-orange transition-all duration-200 p-6 group"
            >
              <div className="flex items-start gap-4">
                <img 
                  src={person.image || `https://i.pravatar.cc/64?u=${person.email || person._id}`} 
                  alt={person.name} 
                  className="w-16 h-16 rounded-full object-cover" 
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{person.name}</h3>
                  <p className="text-gray-600 text-sm truncate">{person.department}</p>
                  <p className="text-gray-500 text-xs">
                    {person.role === "admin" ? "管理者" : person.role === "manager" ? "マネージャー" : person.role === "mentor" ? "メンター" : "メンバー"}
                  </p>
                  
                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    <div>担当メンバー: {stats.activePairs}名</div>
                    <div>総ペア数: {stats.totalMentees}組</div>
                    {person.bio && (
                      <div className="mt-2 text-xs text-gray-600">{person.bio}</div>
                    )}
                    {person.expertise?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {person.expertise.map((exp: string, idx: number) => (
                          <span key={idx} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            {exp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/schedule?managerId=${person._id}`}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center py-2 px-3 rounded-lg hover:from-orange-600 hover:to-orange-700 text-sm transition-all duration-200"
                >
                  1on1を予約
                </Link>
                <Link
                  href={`/people/${person._id}`}
                  className="px-3 py-2 border border-orange-200 rounded-lg hover:bg-orange-50 text-sm text-center transition-colors"
                >
                  詳細
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          該当する人物が見つかりませんでした
        </div>
      )}
    </div>
  );
}