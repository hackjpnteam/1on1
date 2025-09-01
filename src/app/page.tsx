"use client";
import useSWR from "swr";
import { format } from "date-fns";
import Link from "next/link";

export default function Dashboard() {
  const { data: sessions, isLoading: sessionsLoading } = useSWR("/api/sessions");
  const { data: users, isLoading: usersLoading } = useSWR("/api/users");
  const { data: pairs, isLoading: pairsLoading } = useSWR("/api/pairs");
  
  const thisMonth = sessions?.filter((s: any) => new Date(s.scheduledAt).getMonth() === new Date().getMonth());
  const completed = thisMonth?.filter((s: any) => s.status === "completed");
  
  // 予約可能なメンターリスト（マネージャー、管理者、メンター）
  const managers = users?.filter((u: any) => u.role === "manager" || u.role === "admin" || u.role === "mentor" || u.isMentor) || [];
  const availableForBooking = managers.slice(0, 6); // 最大6名表示
  
  if (usersLoading || pairsLoading || sessionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ダッシュボード</h1>
        <Link href="/schedule" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl hover:from-orange-600 hover:to-orange-700 text-sm shadow-md transition-all duration-200">
          1on1を予約
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi title="今月の予定数" value={thisMonth?.length || 0} />
        <Kpi title="今月の実施数" value={completed?.length || 0} />
        <Kpi title="実施率" value={`${thisMonth?.length ? Math.round((completed.length / thisMonth.length) * 100) : 0}%`} />
      </div>
      {/* 予約可能なメンター */}
      <section aria-labelledby="bookable-people" className="w-full max-w-none -mx-6 px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="bookable-people" className="text-lg font-semibold">予約可能なメンター</h2>
          <Link href="/people" className="text-sm text-orange-600 hover:text-orange-700 transition-colors">全て見る →</Link>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 md:gap-6">
          {availableForBooking.map((person: any) => (
            <Link
              key={person._id}
              href={`/schedule?managerId=${person._id}`}
              className="h-full w-full rounded-2xl border border-orange-100 bg-white p-4 shadow-soft transition hover:shadow-soft-orange hover:border-orange-200 text-left group"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={person.image || `https://i.pravatar.cc/48?u=${person.email || person._id}`} 
                  alt={person.name} 
                  className="w-12 h-12 rounded-full object-cover" 
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{person.name}</p>
                  <p className="truncate text-sm text-gray-600">{person.department}</p>
                  <p className="truncate text-xs text-gray-500">
                    {person.role === "admin" ? "管理者" : person.role === "manager" ? "マネージャー" : person.role === "mentor" ? "メンター" : "メンバー"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">

        {/* 直近のセッション */}
        <div className="bg-white rounded-2xl shadow-soft border border-orange-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">直近のセッション</h2>
            <Link href="/timeline" className="text-xs text-orange-600 hover:text-orange-700 transition-colors">
              全て見る →
            </Link>
          </div>
          <ul className="divide-y max-h-80 overflow-y-auto">
            {sessions?.slice(0, 8).map((s: any) => (
              <li key={s._id} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-medium text-orange-700">
                      {s.pairId?.managerId?.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{s.pairId?.managerId?.name} ⇄ {s.pairId?.memberId?.name}</div>
                      <div className="text-gray-500 text-xs">{format(new Date(s.scheduledAt), "MM/dd HH:mm")}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    s.status === 'completed' ? 'bg-green-100 text-green-700' :
                    s.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {s.status === 'completed' ? '完了' : s.status === 'scheduled' ? '予定' : 'キャンセル'}
                  </span>
                </div>
                {s.status === 'scheduled' && (
                  <div className="mt-2">
                    <Link href={`/sessions/${s._id}`} className="text-xs text-orange-600 hover:text-orange-700 transition-colors">
                      詳細 →
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-soft border border-orange-100 p-6 hover:shadow-soft-orange transition-all duration-200">
      <div className="text-sm text-gray-600 font-medium">{title}</div>
      <div className="text-3xl font-bold text-orange-600 mt-2">{value}</div>
    </div>
  );
}