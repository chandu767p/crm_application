import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart } from 'primereact/chart';
import api from '../services/api';
import { formatCurrency, statusColors, capitalize } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import HelpIcon from '../components/common/HelpIcon';

const StatCard = ({ label, value, icon, color, trend, to }) => (
  <Link to={to} className="card p-3 hover:shadow-md transition-all group border border-gray-100 bg-white shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-0.5">{label}</p>
        <div className="flex items-baseline gap-2">
          <h4 className={`text-xl font-bold tracking-tight text-gray-900`}>{value}</h4>
          {trend && (
            <span className={`text-[8px] font-bold ${trend > 0 ? 'text-green-500' : 'text-gray-400'}`}>
              {trend > 0 && '↑'} {trend}
            </span>
          )}
        </div>
      </div>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color.replace('text-', 'bg-').replace('-600', '-50')} border border-white`}>
        {React.cloneElement(icon, { className: "w-4.5 h-4.5 " + color })}
      </div>
    </div>
  </Link>
);

const InsightItem = ({ title, value, type }) => (
  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${type === 'hot' ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.3)]' : 'bg-blue-400'}`} />
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-gray-700 truncate leading-tight">{title}</p>
      <p className="text-[8px] text-gray-400 font-medium">{value}</p>
    </div>
    <svg className="w-2.5 h-2.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !stats) {
    return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>;
  }

  // Chart Configurations - Scaled down for compact side-by-side layout
  const pipelineData = {
    labels: stats.charts.leadsByStatus.map(s => capitalize(s._id)),
    datasets: [{
      data: stats.charts.leadsByStatus.map(s => s.count),
      backgroundColor: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#f1f5f9', '#94a3b8'],
      borderRadius: 4,
      barThickness: 12
    }]
  };

  const sourceData = {
    labels: stats.charts.leadsBySource.map(s => capitalize(s._id)),
    datasets: [{
      data: stats.charts.leadsBySource.map(s => s.count),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
      hoverOffset: 8,
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  const activityData = {
    labels: stats.charts.activityTrend.map(t => new Date(t._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Activity',
      data: stats.charts.activityTrend.map(t => t.count),
      fill: true,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.03)',
      tension: 0.4,
      pointRadius: 1,
      borderWidth: 1.5
    }]
  };

  const commonOptions = {
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { display: false }, x: { display: false } }
  };

  return (
    <div className="flex flex-col h-full space-y-3 overflow-y-auto pb-4 pr-1 custom-scrollbar">
      {/* Header - Ultra Compact */}
      <div className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 rounded flex items-center justify-center shrink-0">
            <span className="text-sm">⚡</span>
          </div>
          <div>
            <div className="flex items-center">
              <h2 className="text-sm font-bold text-gray-800 tracking-tight leading-none">Intelligence Hub</h2>
              <HelpIcon module="dashboard" />
            </div>
            <p className="text-[8px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">Real-time Performance</p>
          </div>
        </div>
        <div className="flex gap-1.5 font-bold">
          <Link to="/leads/new" className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-2 py-1 rounded text-[8px] border border-gray-200 uppercase">Quick Lead</Link>
          <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-2 py-1 rounded text-[8px] shadow-sm uppercase">Refresh</button>
        </div>
      </div>

      {/* Stats Summary - 4-Column Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Pipeline" value={formatCurrency(stats.summary.pipelineValue)} color="text-blue-600" to="/leads" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} trend={-2} />
        <StatCard label="Active Leads" value={stats.summary.leads} color="text-indigo-600" to="/leads" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} trend={12} />
        <StatCard label="Won Deals" value={stats.summary.wonDeals} color="text-green-600" to="/leads" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>} trend={5} />
        <StatCard label="Urgent" value={stats.summary.urgentTickets} color="text-red-500" to="/tickets" icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} trend={-1} />
      </div>

      {/* Visualisation Row - Triple Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Sales Funnel */}
        <div className="card p-3 flex flex-col h-[180px]">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-tighter">Sales Funnel</h3>
            <span className="text-[8px] text-gray-400 font-bold uppercase">Pipeline</span>
          </div>
          <div className="flex-1">
            <Chart type="bar" data={pipelineData} options={{ ...commonOptions, scales: { x: { display: true, grid: { display: false }, ticks: { font: { size: 7 }, color: '#bdbdbd' } } } }} />
          </div>
        </div>

        {/* Lead Sourcing */}
        <div className="card p-3 flex flex-col h-[180px]">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-tighter">Acquisition</h3>
            <span className="text-[8px] text-gray-400 font-bold uppercase">Sources</span>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[140px]">
            {/* Centered container for the doughnut and its overlay */}
            <div className="relative w-28 h-28">
              <Chart type="doughnut" data={sourceData} options={{ ...commonOptions, cutout: '80%', maintainAspectRatio: true }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-gray-800 leading-none">{stats.summary.leads}</span>
                <span className="text-[6px] text-gray-400 font-bold tracking-[0.2em] uppercase mt-0.5">Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Pulse */}
        <div className="card p-3 flex flex-col h-[180px]">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-tighter">Activity Pulse</h3>
            <span className="text-[8px] text-gray-400 font-bold uppercase">Trends</span>
          </div>
          <div className="flex-1">
            <Chart type="line" data={activityData} options={{ ...commonOptions, scales: { x: { display: true, grid: { display: false }, ticks: { font: { size: 7 }, color: '#bdbdbd' } }, y: { display: true, grid: { color: '#fcfcfc' }, ticks: { font: { size: 7 }, color: '#bdbdbd' } } } }} />
          </div>
        </div>
      </div>

      {/* Modern Compact Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="card p-2 md:col-span-1 bg-indigo-50/30 border-indigo-100 flex flex-col justify-center">
          <h3 className="text-[9px] font-bold text-indigo-600 flex items-center gap-2 uppercase tracking-tighter mb-0.5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            Smart Insights
          </h3>
          <p className="text-[7px] text-indigo-400 font-medium leading-tight">Proactive CRM intelligence alerts.</p>
        </div>
        <div className="md:col-span-3 flex gap-2">
          {stats.insights.hotLeads.slice(0, 1).map(lead => (
            <div key={lead._id} className="card p-1.5 flex-1 flex items-center gap-2 border-orange-100 bg-orange-50/20">
              <span className="text-[9px]">🔥</span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-700 truncate leading-none mb-0.5">{lead.name}</p>
                <p className="text-[6px] text-orange-500 font-bold uppercase">Hot Deal • {formatCurrency(lead.value)}</p>
              </div>
            </div>
          ))}
          {stats.insights.stallingLeads.slice(0, 1).map(lead => (
            <div key={lead._id} className="card p-1.5 flex-1 flex items-center gap-2 border-blue-100 bg-blue-50/20">
              <span className="text-[9px]">❄️</span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-700 truncate leading-none mb-0.5">{lead.name}</p>
                <p className="text-[6px] text-blue-500 font-bold uppercase">Stalling • Inactive 7d+</p>
              </div>
            </div>
          ))}
          {stats.insights.overdueTasks > 0 && (
            <div className="card p-1.5 flex-1 flex items-center gap-2 border-red-100 bg-red-50/20">
              <span className="text-[9px]">⚠️</span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-gray-700 leading-none mb-0.5">Critical Tasks</p>
                <p className="text-[6px] text-red-500 font-bold uppercase">{stats.insights.overdueTasks} Overdue Tasks</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Pipeline - Ultra Thin Flow */}
      <div className="card overflow-hidden border border-gray-50 shadow-sm mb-2">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50 bg-gray-50/10">
          <h3 className="text-[8px] font-bold text-gray-500 uppercase tracking-widest leading-none">Recent Lead Flow</h3>
          <Link to="/leads" className="text-[8px] font-bold text-indigo-600 uppercase leading-none">All Views</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[9px]">
            <tbody className="divide-y divide-gray-50">
              {stats.recentLeads.slice(0, 5).map(lead => (
                <tr key={lead._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-gray-700">{lead.name}</td>
                  <td className="px-3 py-1.5 uppercase">
                    <span className={`text-[6px] font-bold px-1 rounded ${statusColors[lead.status]}`}>
                      {capitalize(lead.status)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right font-bold text-gray-500">{formatCurrency(lead.value)}</td>
                  <td className="px-3 py-1.5 text-right text-[7px] text-gray-400">Owner: {lead.assignedTo?.name?.split(' ')[0] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
