"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";

export default function SchedulePage() {
  const { data: users } = useSWR("/api/users");
  const { data: pairs } = useSWR("/api/pairs");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [managerId, setManagerId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [agenda, setAgenda] = useState("");
  const [isCreatingPair, setIsCreatingPair] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // URLパラメータから初期値を設定
  useEffect(() => {
    const managerIdParam = searchParams.get("managerId");
    if (managerIdParam) {
      setManagerId(managerIdParam);
    }
  }, [searchParams]);

  // メンターが選択された時に利用可能時間を取得
  useEffect(() => {
    if (managerId) {
      fetchAvailableSlots(managerId);
    } else {
      setAvailableSlots([]);
    }
  }, [managerId]);

  const fetchAvailableSlots = async (mentorId: string) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`/api/mentors/${mentorId}/available-slots`);
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error fetching available slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const managers = users?.filter((u: any) => u.role === "manager" || u.role === "admin" || u.role === "mentor" || u.isMentor);
  const members = users?.filter((u: any) => u.role === "member");

  // 既存のペアがあるかチェック
  const existingPair = pairs?.find((p: any) => 
    p.managerId._id === managerId && p.memberId._id === memberId
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      let pairId = existingPair?._id;
      
      // ペアが存在しない場合は作成
      if (!pairId && managerId && memberId) {
        setIsCreatingPair(true);
        const pairRes = await fetch("/api/pairs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId,
            memberId,
            cadence: "biweekly",
            active: true
          })
        });
        
        if (!pairRes.ok) {
          alert("ペアの作成に失敗しました");
          return;
        }
        
        const newPair = await pairRes.json();
        pairId = newPair._id;
      }
      
      // セッションを作成
      const sessionRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairId,
          scheduledAt: new Date(scheduledAt),
          status: "scheduled",
          agenda,
          tags: ["予約"]
        })
      });
      
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        console.log("Created session data:", sessionData);
        alert("1on1を予約しました");
        router.push("/timeline");
      } else {
        const errorData = await sessionRes.json();
        console.error("Session creation failed:", errorData);
        alert("予約に失敗しました");
      }
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました");
    } finally {
      setIsCreatingPair(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">1on1を予約</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            上司・メンター
          </label>
          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
            required
          >
            <option value="">選択してください</option>
            {managers?.map((user: any) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.department}) - {user.role === "admin" ? "管理者" : user.role === "manager" ? "マネージャー" : "メンター"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            部下・メンバー
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
            required
          >
            <option value="">選択してください</option>
            {members?.map((user: any) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.department})
              </option>
            ))}
          </select>
        </div>

        {managerId && memberId && !existingPair && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
            新しいペアリングが作成されます
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            日時
          </label>
          {managerId && availableSlots.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">選択されたメンターの予約可能時間:</p>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-xl p-3">
                  {availableSlots.map((slot: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setScheduledAt(slot.dateTime.slice(0, 16))}
                      className={`p-3 text-left border rounded-lg transition-all ${
                        scheduledAt === slot.dateTime.slice(0, 16)
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {slot.date} ({slot.dayOfWeek})
                      </div>
                      <div className="text-xs text-gray-600">
                        {slot.time} - {String(parseInt(slot.time.split(':')[0]) + 1).padStart(2, '0')}:00
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">または手動で日時を入力:</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
          ) : (
            <div>
              {managerId && !loadingSlots && (
                <p className="text-sm text-gray-500 mb-2">
                  このメンターはGoogleカレンダー同期がされていないか、利用可能時間が設定されていません。
                </p>
              )}
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            アジェンダ（任意）
          </label>
          <textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 h-24"
            placeholder="話したいトピックや相談事項を入力..."
          />
        </div>

        <button
          type="submit"
          disabled={isCreatingPair}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isCreatingPair ? "作成中..." : "予約する"}
        </button>
      </form>

      {/* 既存のペア一覧 */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h2 className="text-lg font-medium mb-4">現在のペアリング</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {pairs?.map((pair: any) => (
            <div key={pair._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <div className="text-sm">
                <span className="font-medium">{pair.managerId?.name}</span>
                <span className="mx-2">⇄</span>
                <span className="font-medium">{pair.memberId?.name}</span>
              </div>
              <span className="text-xs text-gray-500">{pair.cadence}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}