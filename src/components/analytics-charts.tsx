"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, ResponsiveContainer, CartesianGrid } from "recharts";

export function AnalyticsCharts({ scoreTrend, byType }: { scoreTrend: any[]; byType: any[] }) {
  if (!scoreTrend.length) return (
    <div className="card text-center py-10 text-gray-400">Complete interviews to see analytics</div>
  );

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-4">Score Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={scoreTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
            <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#f3f4f6" }} />
            <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {byType.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Score by Interview Type</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="type" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#f3f4f6" }} />
              <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}