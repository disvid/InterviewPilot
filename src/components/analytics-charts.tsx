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
        <div className="text-5xl mb-4 opacity-40">📈</div>
        <h3 className="text-lg font-medium text-gray-300">No data yet</h3>
        <p className="text-gray-400 mt-2 max-w-xs mx-auto">
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
          <h3 className="text-xl font-semibold">Performance Trend</h3>
          <span className="text-xs text-gray-500">Last {scoreTrend.length} interviews</span>
        </div>
        
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={scoreTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: "#6b7280" }} 
              tickLine={{ stroke: "#374151" }}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={{ stroke: "#374151" }}
            />
            <Tooltip 
              contentStyle={{ 
                background: "#111827", 
                border: "1px solid #374151", 
                borderRadius: "12px", 
                color: "#f3f4f6",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.3)"
              }} 
            />
            <Line 
              type="natural" 
              dataKey="score" 
              stroke="#60a5fa" 
              strokeWidth={3} 
              dot={{ fill: "#3b82f6", r: 5, strokeWidth: 2, stroke: "#1e40af" }}
              activeDot={{ r: 7, fill: "#bae6fd" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Score by Interview Type */}
      {byType.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-6">Performance by Interview Type</h3>
          
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis 
                dataKey="type" 
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#374151" }}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#374151" }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: "#111827", 
                  border: "1px solid #374151", 
                  borderRadius: "12px", 
                  color: "#f3f4f6" 
                }} 
              />
              <Bar 
                dataKey="avgScore" 
                fill="#3b82f6" 
                radius={[8, 8, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}