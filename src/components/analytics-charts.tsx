"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, ResponsiveContainer, CartesianGrid } from "recharts";

export function AnalyticsCharts({ 
  scoreTrend, 
  byType 
}: { 
  scoreTrend: any[]; 
  byType: any[] 
}) {
  if (!scoreTrend.length) {
    return (
      <div className="card text-center py-16">
        <div className="text-5xl mb-4 opacity-40">◈</div>
        <h3 className="text-lg font-medium text-slate-300">No data yet</h3>
        <p className="text-slate-400 mt-2 max-w-xs mx-auto">
          Complete a few interviews to start seeing your performance trends and insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Score Trend Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-100">Performance Trend</h3>
          <span className="text-xs text-slate-500">Last {scoreTrend.length} interviews</span>
        </div>
        
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={scoreTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: "#94a3b8" }} 
              tickLine={{ stroke: "#475569" }}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              tickLine={{ stroke: "#475569" }}
            />
            <Tooltip 
              contentStyle={{ 
                background: "#0f172a", 
                border: "1px solid #475569", 
                borderRadius: "8px", 
                color: "#f1f5f9",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.3)"
              }} 
            />
            <Line 
              type="natural" 
              dataKey="score" 
              stroke="#14b8a6" 
              strokeWidth={3} 
              dot={{ fill: "#14b8a6", r: 5, strokeWidth: 2, stroke: "#0d9488" }}
              activeDot={{ r: 7, fill: "#99f6e4" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Score by Interview Type */}
      {byType.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-6 text-slate-100">Performance by Interview Type</h3>
          
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="type" 
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickLine={{ stroke: "#475569" }}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickLine={{ stroke: "#475569" }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: "#0f172a", 
                  border: "1px solid #475569", 
                  borderRadius: "8px", 
                  color: "#f1f5f9" 
                }} 
              />
              <Bar 
                dataKey="avgScore" 
                fill="#14b8a6" 
                radius={[8, 8, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
