import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../context/AdminContext';
import '../../styles/AdminCss/SalesChart.css';

const SalesChart = () => {
  const { salesData } = useAdmin();

  return (
    <div className="sales-chart-container">
      <div className="chart-header">
        <h3>Sales Overview</h3>
        <div className="chart-controls">
          <select className="time-period">
            <option>Last 7 Days</option>
            <option>Last Month</option>
            <option>Last Quarter</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
              labelStyle={{ color: '#666' }}
            />
            <Legend />
            <Bar 
              dataKey="revenue" 
              name="Revenue" 
              fill="#8884d8" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="sales" 
              name="Units Sold" 
              fill="#82ca9d" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;