const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Models
const User = require('../models/User');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Ticket = require('../models/Ticket');
const Task = require('../models/Task');
const Deal = require('../models/Deal');
const Account = require('../models/Account');
const Activity = require('../models/Activity');
const CustomerActivity = require('../models/CustomerActivity');
const Role = require('../models/Role');

// ---------------- STATIC DATA FOR REALISM ---------------- //
const notePhrases = [
  'Client is very interested in the premium tier.',
  'Need to follow up next week after their board meeting.',
  'Requested more information on enterprise pricing.',
  'Concerned about the implementation timeline, need to reassure.',
  'Decision maker is currently out of office, returning Monday.',
  'Had a great initial conversation. Sending marketing materials.',
  'Pricing seems to be a blocker. Will offer a 10% discount.',
  'Competitor is also in the mix. We need to highlight our unique features.',
];

const taskTitles = [
  'Call to discuss proposal', 'Review quarterly goals', 'Send follow-up email',
  'Prepare onboarding documents', 'Schedule product demo', 'Finalize contract details',
  'Check in on onboarding progress', 'Send updated pricing sheet',
];

const ticketSubjects = [
  'Login issue with platform', 'Cannot export data from dashboard',
  'Billing inquiry regarding last invoice', 'Feature request: API integration',
  'System seems slow during peak hours', 'Password reset link not received',
];

const industries = ['Technology', 'Finance', 'Healthcare', 'Energy', 'Logistics', 'Retail', 'Education', 'Construction', 'Marketing', 'Security'];

// ---------------- SEED FUNCTION ---------------- //

const seed = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db_new2';
  console.log(`📡 Connecting to: ${uri}`);
  
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  // Clear DB
  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany(),
    Lead.deleteMany(),
    Contact.deleteMany(),
    Ticket.deleteMany(),
    Task.deleteMany(),
    Deal.deleteMany(),
    Account.deleteMany(),
    Activity.deleteMany(),
    CustomerActivity.deleteMany(),
    Role.deleteMany(),
  ]);

  console.log('✅ Database cleared');

  // 1. Roles
  const allPermissions = ['dashboard', 'users', 'leads', 'contacts', 'roles', 'tickets', 'tasks', 'deals', 'accounts', 'activities'];
  
  const roles = await Role.create([
    { 
      name: 'admin', 
      description: 'System Administrator with full access',
      permissions: allPermissions
    },
    { 
      name: 'manager', 
      description: 'Team Manager with limited administrative access',
      permissions: ['dashboard', 'leads', 'contacts', 'tickets', 'tasks', 'deals', 'accounts', 'activities']
    },
    { 
      name: 'sales', 
      description: 'Sales Representative focused on leads and deals',
      permissions: ['dashboard', 'leads', 'contacts', 'deals', 'tasks', 'accounts', 'activities']
    }
  ]);

  const adminRole = roles.find(r => r.name === 'admin')._id;
  const salesRole = roles.find(r => r.name === 'sales')._id;

  // 2. Users
  const plainPassword = 'password123';
  
  const adminUser = await User.create({
    name: 'DO Systems Admin',
    email: 'admin@dosystems.io',
    password: plainPassword,
    role: adminRole,
  });

  const salesUser1 = await User.create({
    name: 'John Sales',
    email: 'john@dosystems.io',
    password: plainPassword,
    role: salesRole,
  });

  const salesUser2 = await User.create({
    name: 'Sarah Close',
    email: 'sarah@dosystems.io',
    password: plainPassword,
    role: salesRole,
  });

  const users = [adminUser, salesUser1, salesUser2];
  console.log('✅ Users created: admin@dosystems.io / password123');

  // 3. Accounts (50)
  const accountData = Array.from({ length: 50 }).map(() => ({
    name: faker.company.name(),
    industry: faker.helpers.arrayElement(industries),
    website: faker.internet.domainName(),
    description: faker.company.catchPhrase(),
    owner: faker.helpers.arrayElement(users)._id,
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zip: faker.location.zipCode(),
      country: 'USA'
    },
    tags: [faker.helpers.arrayElement(['enterprise', 'smb', 'high-priority', 'new-market'])]
  }));

  const accounts = await Account.insertMany(accountData);
  console.log('✅ 50 Accounts created');

  // 4. Contacts (75)
  const contactData = Array.from({ length: 75 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.string.numeric(10), // Ensures it's within 20 chars
    jobTitle: faker.person.jobTitle(),
    account: faker.helpers.arrayElement(accounts)._id,
    assignedTo: faker.helpers.arrayElement(users)._id,
  }));

  const contacts = await Contact.insertMany(contactData);
  console.log('✅ 75 Contacts created');

  // 5. Leads (60)
  const leadData = Array.from({ length: 60 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.string.numeric(10), // Ensures it's within 20 chars
    status: faker.helpers.arrayElement(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
    source: faker.helpers.arrayElement(['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'event', 'other']),
    value: faker.number.int({ min: 1000, max: 50000 }),
    account: faker.helpers.arrayElement(accounts)._id,
    assignedTo: faker.helpers.arrayElement(users)._id,
    notes: [{ 
      content: faker.helpers.arrayElement(notePhrases), 
      createdBy: faker.helpers.arrayElement(users)._id 
    }]
  }));

  const leads = await Lead.insertMany(leadData);
  console.log('✅ 60 Leads created');

  // 6. Deals (50) - Linked to Contacts/Accounts
  const dealData = Array.from({ length: 50 }).map(() => ({
    name: `${faker.company.name()} Deal`,
    value: faker.number.int({ min: 5000, max: 100000 }),
    probability: faker.number.int({ min: 10, max: 90 }),
    stage: faker.helpers.arrayElement(['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
    contact: faker.helpers.arrayElement(contacts)._id,
    account: faker.helpers.arrayElement(accounts)._id,
    assignedTo: faker.helpers.arrayElement(users)._id,
    expectedCloseDate: faker.date.future(),
  }));

  const deals = await Deal.insertMany(dealData);
  console.log('✅ 50 Deals created');

  // 7. Tasks (70)
  const taskData = Array.from({ length: 70 }).map(() => {
    const onModel = faker.helpers.arrayElement(['Lead', 'Contact', 'Ticket']);
    let relatedTo;
    if (onModel === 'Lead') relatedTo = faker.helpers.arrayElement(leads)._id;
    else relatedTo = faker.helpers.arrayElement(contacts)._id;

    return {
      title: faker.helpers.arrayElement(taskTitles),
      description: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed']),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
      dueDate: faker.date.between({ from: new Date(Date.now() - 7*24*60*60*1000), to: new Date(Date.now() + 14*24*60*60*1000) }),
      assignedTo: faker.helpers.arrayElement(users)._id,
      onModel,
      relatedTo
    };
  });
  const tasks = await Task.insertMany(taskData);
  console.log('✅ 70 Tasks created');

  // 8. Tickets (50)
  const tickets = await Ticket.insertMany(Array.from({ length: 50 }).map(() => ({
    subject: faker.helpers.arrayElement(ticketSubjects),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(['open', 'in_progress', 'resolved', 'closed']),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
    contact: faker.helpers.arrayElement(contacts)._id,
    assignedTo: faker.helpers.arrayElement(users)._id,
  })));
  console.log('✅ 50 Tickets created');

  // 9. Activities (100) - Spread over last 14 days
  const models = [
    { list: leads, name: 'Lead' },
    { list: contacts, name: 'Contact' },
    { list: accounts, name: 'Account' },
    { list: deals, name: 'Deal' },
  ];

  const activityData = Array.from({ length: 120 }).map(() => {
    const type = faker.helpers.arrayElement(['call', 'email', 'meeting']);
    const model = faker.helpers.arrayElement(models);
    const target = faker.helpers.arrayElement(model.list);
    const status = faker.helpers.arrayElement(['scheduled', 'completed', 'cancelled']);

    return {
      type,
      subject: faker.helpers.arrayElement(['Follow-up', 'Product Demo', 'Negotiation', 'Discovery', 'Technical Support']),
      description: faker.lorem.sentence(),
      duration: status === 'completed' ? faker.number.int({ min: 5, max: 45 }) : 0,
      status,
      activityDate: status === 'scheduled' ? faker.date.future() : faker.date.recent({ days: 14 }),
      relatedTo: target._id,
      onModel: model.name,
      purpose: faker.helpers.arrayElement(['discovery', 'follow_up', 'negotiation', 'support', 'demo', 'other']),
      outcome: type === 'call' ? faker.helpers.arrayElement(['answered', 'no_answer', 'busy', 'left_voicemail', 'scheduled_follow_up', 'closed', 'refused']) : undefined,
      createdBy: faker.helpers.arrayElement(users)._id,
    };
  });

  await CustomerActivity.insertMany(activityData);
  console.log('✅ 120 Customer Activities (calls/emails/meetings) created');

  // 10. System Audit Logs (100)
  const auditLogs = Array.from({ length: 100 }).map(() => {
    const action = faker.helpers.arrayElement(['login', 'viewed', 'created', 'updated', 'status_changed']);
    const model = faker.helpers.arrayElement(models);
    const target = faker.helpers.arrayElement(model.list);
    const user = faker.helpers.arrayElement(users);

    const data = {
      action,
      entityType: model.name,
      createdBy: user._id,
      activityDate: faker.date.recent({ days: 30 }),
      requestMethod: faker.helpers.arrayElement(['GET', 'POST', 'PUT', 'DELETE']),
      requestUrl: `/api/${model.name.toLowerCase()}s/${target._id}`,
    };

    if (action === 'login') {
      data.entityType = 'User';
      data.subject = 'User Login';
      data.description = `User ${user.name} logged in successfully.`;
      data.relatedTo = user._id;
      data.onModel = 'User';
      data.requestUrl = '/api/auth/login';
      data.requestMethod = 'POST';
    } else if (action === 'viewed') {
      data.subject = `Viewed ${model.name}: ${target.name || target.subject || target._id}`;
      data.description = `User viewed the details of ${model.name}`;
      data.relatedTo = target._id;
      data.onModel = model.name;
      data.requestMethod = 'GET';
    } else if (action === 'status_changed') {
      data.subject = 'Status Changed';
      data.description = `Status changed to ${target.status}`;
      data.relatedTo = target._id;
      data.onModel = model.name;
    } else {
      data.subject = `${model.name} ${action}`;
      data.description = `Operation performed on ${model.name}`;
      data.relatedTo = target._id;
      data.onModel = model.name;
    }

    return data;
  });

  await Activity.insertMany(auditLogs);
  console.log('✅ 100 System Audit Logs (monitoring data) created');

  console.log(`
🚀 BULK SEED COMPLETE
---------------------
Users: ${users.length}
Accounts: 50
Contacts: 75
Leads: 60
Deals: 50
Tasks: 70
Tickets: 50
Activities: 120
---------------------
Admin Login: admin@dosystems.io / password123
`);

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Bulk Seed Error:', err);
  process.exit(1);
});