import React, { useState } from 'react';
import Modal from './Modal';

const HELP_CONTENT = {
  dashboard: {
    title: 'Dashboard Overview',
    description: 'The Dashboard provides a real-time summary of your entire CRM. Monitor key metrics like lead volume, sales pipeline health, and team activity trends at a glance.',
    benefits: [
      'Visual performance tracking with dynamic charts',
      'Quick insights into hot leads and recent activities',
      'Interactive widgets for rapid navigation to specific modules'
    ]
  },
  leads: {
    title: 'Lead Management',
    description: 'Leads are potential business opportunities that represent the starting point of your sales cycle. Use this screen to capture and qualify prospects before they are converted into long-term clients.',
    benefits: [
      'Track the source of your leads to optimize marketing spend',
      'Manage status transitions through a standardized qualification process',
      'Convert qualified leads directly into Contacts and Deals with one click'
    ]
  },
  accounts: {
    title: 'Organization Management',
    description: 'Accounts represent the companies or organizations you do business with. They act as central hubs where you can link multiple individual contacts, ongoing deals, and historical activity logs.',
    benefits: [
      'Maintain a centralized directory of all client organizations',
      'View a 360-degree timeline of all interactions with a specific company',
      'Map complex B2B relationships with hierarchical account data'
    ]
  },
  contacts: {
    title: 'Contact Management',
    description: 'Contacts are the individual people you interact with. Unlike Leads, Contacts are typically associated with established Accounts and represent the human side of your professional networks.',
    benefits: [
      'Store detailed communication preferences and personal info',
      'Link individuals to their respective parent organizations',
      'Keep a historical record of every meeting, email, and phone call'
    ]
  },
  deals: {
    title: 'Sales Pipeline',
    description: 'Deals represent specific sales opportunities and their projected revenue. This module uses a visual pipeline (Board View) to help you manage and forecast your sales cycle effectively.',
    benefits: [
      'Visualize your sales funnel with a drag-and-drop Kanban board',
      'Monitor deal values and weighted probabilities for accurate forecasting',
      'Identify bottlenecks in your sales process by tracking stage movement'
    ]
  },
  tasks: {
    title: 'Task & Workflow Tracking',
    description: 'Tasks are actionable to-dos that keep your team organized and focused. You can create personal reminders or assign work to colleagues, ensuring no follow-up is ever missed.',
    benefits: [
      'Set priorities and due dates to manage team workloads',
      'Link tasks directly to leads or contacts for contextual follow-ups',
      'Track completion status to monitor team productivity'
    ]
  },
  tickets: {
    title: 'Support Desk',
    description: 'Tickets allow your team to manage customer inquiries, technical issues, and internal requests systematically. This module ensures all problems are tracked through to resolution.',
    benefits: [
      'Set urgency levels (Low to Urgent) to prioritize support efforts',
      'Assign tickets to specific specialists and monitor progress',
      'Maintain a public or internal history of resolved issues'
    ]
  },
  activities: {
    title: 'Interaction History',
    description: 'Activities log every touchpoint with your clients. This includes phone calls, emails, and meetings. It is the definitive source for understanding the history of a relationship.',
    benefits: [
      'View a unified timeline of all communication types',
      'Filter interaction logs by type, owner, or date range',
      'Collaborate by sharing detailed notes from meetings and calls'
    ]
  },
  roles: {
    title: 'Access Control (RBAC)',
    description: 'Roles define the permissions and access levels for your team members. This module allows administrators to ensure data security by restricting sensitive information to authorized personnel.',
    benefits: [
      'Create custom roles for different departments (Sales, Support, HR)',
      'Manage module-level permissions for every area of the CRM',
      'Scale your team securely as your business grows'
    ]
  },
  users: {
    title: 'User Administration',
    description: 'The Users module is where you manage your internal team. Add new colleagues, update profiles, and assign them to the appropriate roles to grant them access to the platform.',
    benefits: [
      'Centralized management of team member accounts',
      'Monitor user login activity and security status',
      'Assign account owners and task leads'
    ]
  }
};

export default function HelpIcon({ module }) {
  const [isOpen, setIsOpen] = useState(false);
  const content = HELP_CONTENT[module] || {
    title: 'Help Center',
    description: 'Contextual information for this module is currently being updated.',
    benefits: []
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="ml-2 p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
        title="What is this screen?"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={content.title}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            {content.description}
          </p>
          
          {content.benefits.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="text-base">🚀</span>
                Key Benefits
              </h4>
              <ul className="space-y-2.5">
                {content.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-xs text-gray-700 font-semibold">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold tracking-wider"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
