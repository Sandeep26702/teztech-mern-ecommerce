import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// ✅ CORRECT AdminContext import (same level → ../context)
import { useAdmin } from "../context/AdminContext";

// ✅ CSS IMPORT ONLY ONCE
import "../../styles/AdminCss/UserActivity.css";

const UserActivity = () => {
  const { userActivity } = useAdmin(); // coming from AdminContext

  return (
    <div className="user-activity">
      <h3>User Activity</h3>
      <p>Real-time active users</p>

      <div className="activity-chart">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={userActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <defs>
              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="active"
              stroke="#3b82f6"
              fill="url(#colorActive)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="activity-stats">
        <div className="stat">
          <span className="stat-value">85</span>
          <span className="stat-label">Peak Users</span>
        </div>
        <div className="stat">
          <span className="stat-value">67</span>
          <span className="stat-label">Avg. Users</span>
        </div>
        <div className="stat">
          <span className="stat-value">+12%</span>
          <span className="stat-label">Growth</span>
        </div>
      </div>
    </div>
  );
};

export default UserActivity;
