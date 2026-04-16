import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
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

  // Canvas Refs
  const funnelRef = useRef(null);
  const sourceRef = useRef(null);
  const activityRef = useRef(null);

  // Chart Instance Refs (to handle cleanup)
  const funnelChart = useRef(null);
  const sourceChart = useRef(null);
  const activityChart = useRef(null);

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

  useEffect(() => {
    if (!stats || loading) return;

    const cleanup = () => {
      [funnelChart, sourceChart, activityChart].forEach(ref => {
        if (ref.current) {
          ref.current.destroy();
          ref.current = null;
        }
      });
    };

    cleanup();

    // 1. Sales Funnel Chart
    if (funnelRef.current) {
      funnelChart.current = new Chart(funnelRef.current, {
        type: 'bar',
        data: {
          labels: stats.charts.leadsByStatus.map(s => capitalize(s._id)),
          datasets: [{
            data: stats.charts.leadsByStatus.map(s => s.count),
            backgroundColor: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#f1f5f9', '#94a3b8'],
            borderRadius: 4,
            barThickness: 12
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { display: false },
            x: {
              grid: { display: false },
              ticks: { font: { size: 7 }, color: '#bdbdbd' }
            }
          }
        }
      });
    }

    // 2. Acquisition Doughnut
    if (sourceRef.current) {
      sourceChart.current = new Chart(sourceRef.current, {
        type: 'doughnut',
        data: {
          labels: stats.charts.leadsBySource.map(s => capitalize(s._id)),
          datasets: [{
            data: stats.charts.leadsBySource.map(s => s.count),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '50%',
          plugins: { legend: { display: false } }
        }
      });
    }

    // 3. Activity Pulse Chart
    if (activityRef.current) {
      activityChart.current = new Chart(activityRef.current, {
        type: 'line',
        data: {
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
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 7 }, color: '#ffffffff' }
            },
            y: {
              grid: { color: '#001a57ff' },
              ticks: { font: { size: 7 }, color: '#bdbdbd' }
            }
          }
        }
      });
    }

    return cleanup;
  }, [stats, loading]);

  if (loading || !stats) {
    return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>;
  }

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

      {/* Stats Summary - 8-Card High-Density Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Leads"
          value={stats.summary.leads}
          color="text-indigo-600"
          to="/leads"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          trend={12}
        />
        <StatCard
          label="Active Deals"
          value={stats.summary.activeDeals}
          color="text-blue-600"
          to="/deals"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          trend={5}
        />
        <StatCard
          label="Won Revenue"
          value={formatCurrency(stats.summary.wonRevenue)}
          color="text-green-600"
          to="/deals"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          trend={8}
        />
        <StatCard
          label="Open Tickets"
          value={stats.summary.openTickets}
          color="text-orange-500"
          to="/tickets"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          trend={-2}
        />
        <StatCard
          label="Contacts"
          value={stats.summary.contacts}
          color="text-teal-600"
          to="/contacts"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <StatCard
          label="Accounts"
          value={stats.summary.accounts}
          color="text-slate-600"
          to="/accounts"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          label="Projects"
          value={stats.summary.projects}
          color="text-purple-600"
          to="/projects"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard
          label="Overdue Tasks"
          value={stats.summary.pendingTasks}
          color="text-red-600"
          to="/tasks"
          icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          trend={stats.summary.pendingTasks > 0 ? 1 : 0}
        />
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
            <canvas ref={funnelRef} />
          </div>
        </div>

        {/* Lead Sourcing */}
        <div className="card p-3 flex flex-col h-[180px]">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-tighter">Acquisition</h3>
            <span className="text-[8px] text-gray-400 font-bold uppercase">Sources</span>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[120px]">
            {/* Centered container for the doughnut and its overlay */}
            <div className="relative w-28 h-28">
              <canvas ref={sourceRef} />
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
            <canvas ref={activityRef} />
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
            <tbody>
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
