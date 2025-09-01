"use client";
import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function MentorDetailPage() {
  const params = useParams();
  const mentorId = params.id as string;
  
  const { data: users, isLoading } = useSWR("/api/users");
  const { data: pairs } = useSWR("/api/pairs");

  const mentor = users?.find((u: any) => u._id === mentorId);

  // 統計情報を取得
  const getMentorStats = () => {
    if (!pairs || !mentor) return { totalMentees: 0, activePairs: 0 };
    
    const mentorPairs = pairs.filter((p: any) => p.managerId._id === mentorId);
    return {
      totalMentees: mentorPairs.length,
      activePairs: mentorPairs.filter((p: any) => p.active).length
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h1 className="text-xl font-bold text-red-800">メンターが見つかりません</h1>
          <p className="text-red-600">指定されたメンターは存在しないか、削除されています。</p>
          <Link href="/people" className="text-orange-600 hover:underline mt-2 inline-block">
            メンター一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const stats = getMentorStats();

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <Link 
          href="/people" 
          className="text-orange-600 hover:text-orange-700 hover:underline transition-colors"
        >
          ← メンター一覧に戻る
        </Link>
        <Link
          href={`/schedule?managerId=${mentorId}`}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl hover:from-orange-600 hover:to-orange-700 text-sm shadow-md transition-all duration-200"
        >
          1on1を予約
        </Link>
      </div>

      {/* メンタープロフィール */}
      <div className="bg-white rounded-2xl shadow-soft border border-orange-100 p-8">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="flex-shrink-0">
            <img 
              src={mentor.image || `https://i.pravatar.cc/120?u=${mentor.email || mentor._id}`} 
              alt={mentor.name} 
              className="w-32 h-32 rounded-full object-cover shadow-md" 
            />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mentor.name}</h1>
              <p className="text-lg text-gray-600">{mentor.department}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  mentor.role === "admin" ? "bg-red-100 text-red-800" :
                  mentor.role === "manager" ? "bg-blue-100 text-blue-800" :
                  mentor.role === "mentor" ? "bg-orange-100 text-orange-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {mentor.role === "admin" ? "管理者" : 
                   mentor.role === "manager" ? "マネージャー" : 
                   mentor.role === "mentor" ? "メンター" : "メンバー"}
                </span>
                {mentor.isMentor && (
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                    メンター認定
                  </span>
                )}
              </div>
            </div>

            {/* 統計情報 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-orange-600">{stats.activePairs}</div>
                <div className="text-sm text-gray-600">現在のメンティー</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{stats.totalMentees}</div>
                <div className="text-sm text-gray-600">総ペア数</div>
              </div>
            </div>
          </div>
        </div>

        {/* 自己紹介 */}
        {mentor.bio && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-3">自己紹介</h2>
            <p className="text-gray-700 leading-relaxed">{mentor.bio}</p>
          </div>
        )}

        {/* 専門分野 */}
        {mentor.expertise?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-3">専門分野</h2>
            <div className="flex flex-wrap gap-2">
              {mentor.expertise.map((exp: string, idx: number) => (
                <span key={idx} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-medium">
                  {exp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* カレンダー情報 */}
        {mentor.isMentor && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-3">予約可能時間</h2>
            {mentor.googleCalendarId ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm text-gray-600">Googleカレンダーと連携済み</span>
                </div>
                {mentor.availableSlots?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {mentor.availableSlots.map((slot: any, idx: number) => (
                      <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="font-medium text-sm">
                          {["日", "月", "火", "水", "木", "金", "土"][slot.dayOfWeek]}曜日
                        </div>
                        <div className="text-gray-600 text-sm">
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">予約可能時間が設定されていません</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-sm text-gray-600">Googleカレンダー未連携</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex gap-4">
        <Link
          href={`/schedule?managerId=${mentorId}`}
          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center py-3 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 font-medium transition-all duration-200"
        >
          1on1を予約する
        </Link>
        <Link
          href="/people"
          className="px-6 py-3 border border-orange-300 text-orange-600 rounded-xl hover:bg-orange-50 transition-colors"
        >
          他のメンターを見る
        </Link>
      </div>
    </div>
  );
}