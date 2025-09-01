"use client";
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PairsPage() {
  const { data } = useSWR("/api/pairs", fetcher);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">ペア一覧</h1>
      <table className="min-w-full bg-white rounded-2xl shadow-soft overflow-hidden text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">上司</th>
            <th className="text-left p-3">部下</th>
            <th className="text-left p-3">頻度</th>
            <th className="text-left p-3">状態</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((p: any) => (
            <tr key={p._id} className="border-t">
              <td className="p-3">{p.managerId?.name}</td>
              <td className="p-3">{p.memberId?.name}</td>
              <td className="p-3">{p.cadence}</td>
              <td className="p-3">{p.active ? "active" : "inactive"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}