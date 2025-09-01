"use client";
import useSWR from "swr";
import { format } from "date-fns";
import Link from "next/link";
import React from "react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TimelinePage() {
  const { data: sessions, mutate } = useSWR("/api/sessions", fetcher);
  
  // ページが表示されるたびにデータを再取得
  React.useEffect(() => {
    mutate();
  }, [mutate]);
  
  console.log("Timeline sessions data:", sessions);
  
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">タイムライン</h1>
      
      {!sessions && <div>セッションを読み込み中...</div>}
      {sessions && sessions.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">まだ予約されたセッションがありません。</p>
        </div>
      )}
      
      <ul className="space-y-3">
        {sessions?.map((s: any) => (
          <li key={s._id} className="bg-white rounded-2xl shadow-soft p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                  {s.pairId?.managerId?.name?.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{s.pairId?.managerId?.name} ⇄ {s.pairId?.memberId?.name}</div>
                  <div className="text-xs text-gray-500">{s.pairId?.managerId?.department || '部署未設定'}</div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  s.status === 'completed' ? 'bg-green-100 text-green-700' :
                  s.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {s.status === 'completed' ? '実施済み' : s.status === 'scheduled' ? '予定' : 'キャンセル'}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-2">{format(new Date(s.scheduledAt), "yyyy/MM/dd HH:mm")} に1on1</div>
            {s.agenda && <div className="text-sm mt-2"><span className="text-gray-500">アジェンダ：</span>{s.agenda}</div>}
            {s.status === 'scheduled' && (
              <div className="mt-3">
                <Link href={`/sessions/${s._id}`} className="text-xs text-blue-600 hover:text-blue-800">
                  詳細・実施 →
                </Link>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}