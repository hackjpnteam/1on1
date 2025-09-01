"use client";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useState, use } from "react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SessionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: all } = useSWR("/api/sessions", fetcher);
  const s = all?.find((x: any) => x._id === id);
  const [notesShared, setNotesShared] = useState(s?.notesShared || "");
  const [notesPrivate, setNotesPrivate] = useState(s?.notesPrivate || "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const router = useRouter();

  if (!s) return <div className="text-sm text-gray-500">読み込み中...</div>;

  async function save() {
    await fetch(`/api/sessions/${s._id}`, { method: "PATCH", body: JSON.stringify({ notesShared, notesPrivate }), headers: { "Content-Type": "application/json" } });
    alert("保存しました");
  }
  async function complete() {
    await fetch(`/api/sessions/${s._id}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }), headers: { "Content-Type": "application/json" } });
    alert("実施に更新");
    router.push("/timeline");
  }
  async function submitFeedback() {
    await fetch(`/api/feedback`, { method: "POST", body: JSON.stringify({ sessionId: s._id, userId: s.pairId?.memberId?._id, rating, comment }), headers: { "Content-Type": "application/json" } });
    alert("フィードバック送信");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{s.pairId?.managerId?.name} ⇄ {s.pairId?.memberId?.name}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-soft p-4">
          <h2 className="font-medium mb-2">メモ（共有）</h2>
          <textarea className="w-full h-40 border rounded-xl p-2" value={notesShared} onChange={(e) => setNotesShared(e.target.value)} />
          <h2 className="font-medium mb-2 mt-4">メモ（プライベート）</h2>
          <textarea className="w-full h-40 border rounded-xl p-2" value={notesPrivate} onChange={(e) => setNotesPrivate(e.target.value)} />
          <div className="mt-3 flex gap-2">
            <button onClick={save} className="px-3 py-2 text-sm rounded-xl bg-gray-900 text-white">保存</button>
            <button onClick={complete} className="px-3 py-2 text-sm rounded-xl bg-emerald-600 text-white">実施に更新</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-4">
          <h2 className="font-medium mb-2">フィードバック</h2>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">満足度：</span>
            <select className="border rounded-lg p-1" value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <textarea className="w-full h-32 border rounded-xl p-2" placeholder="気づき・所感" value={comment} onChange={(e) => setComment(e.target.value)} />
          <div className="mt-3">
            <button onClick={submitFeedback} className="px-3 py-2 text-sm rounded-xl bg-blue-600 text-white">送信</button>
          </div>
        </div>
      </div>
    </div>
  );
}