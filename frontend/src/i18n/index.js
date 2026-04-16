import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Nav
      dashboard: 'Dashboard', leads: 'Leads', deals: 'Deals', contacts: 'Contacts',
      accounts: 'Accounts', users: 'Users', roles: 'Roles', calls: 'Calls',
      emails: 'Emails', meetings: 'Meetings', tickets: 'Tickets', tasks: 'Tasks',
      employees: 'Employees', projects: 'Projects', calendar: 'Calendar',
      emailTemplates: 'Email Templates', versionHistory: 'Version History',
      // Common
      add: 'Add', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel',
      search: 'Search', filter: 'Filter', export: 'Export', import: 'Import',
      refresh: 'Refresh', view: 'View', close: 'Close', confirm: 'Confirm',
      loading: 'Loading...', noRecords: 'No records found', actions: 'Actions',
      total: 'total', selected: 'Selected', clearFilters: 'Clear Filters',
      saveFilter: 'Save Filter', savedFilters: 'Saved Filters', setDefault: 'Set as Default',
      // Auth
      signIn: 'Sign In', signOut: 'Sign Out', register: 'Register',
      email: 'Email address', password: 'Password', forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password', newPassword: 'New Password',
      currentPassword: 'Current Password', changePassword: 'Change Password',
      twoFactor: 'Two-Factor Authentication', enterCode: 'Enter 6-digit code',
      // Status
      active: 'Active', inactive: 'Inactive', pending: 'Pending', cancelled: 'Cancelled',
      // Modules
      name: 'Name', status: 'Status', priority: 'Priority', department: 'Department',
      startDate: 'Start Date', endDate: 'End Date', budget: 'Budget', progress: 'Progress',
      assignedTo: 'Assigned To', createdAt: 'Created', description: 'Description',
    },
  },
  es: {
    translation: {
      // Nav
      dashboard: 'Panel', leads: 'Prospectos', deals: 'Negocios', contacts: 'Contactos',
      accounts: 'Cuentas', users: 'Usuarios', roles: 'Roles', calls: 'Llamadas',
      emails: 'Correos', meetings: 'Reuniones', tickets: 'Tickets', tasks: 'Tareas',
      employees: 'Empleados', projects: 'Proyectos', calendar: 'Calendario',
      emailTemplates: 'Plantillas de Email', versionHistory: 'Historial de Versiones',
      // Common
      add: 'Agregar', edit: 'Editar', delete: 'Eliminar', save: 'Guardar', cancel: 'Cancelar',
      search: 'Buscar', filter: 'Filtrar', export: 'Exportar', import: 'Importar',
      refresh: 'Actualizar', view: 'Ver', close: 'Cerrar', confirm: 'Confirmar',
      loading: 'Cargando...', noRecords: 'Sin registros', actions: 'Acciones',
      total: 'total', selected: 'Seleccionados', clearFilters: 'Limpiar Filtros',
      saveFilter: 'Guardar Filtro', savedFilters: 'Filtros Guardados', setDefault: 'Predeterminado',
      // Auth
      signIn: 'Iniciar Sesión', signOut: 'Cerrar Sesión', register: 'Registrarse',
      email: 'Correo electrónico', password: 'Contraseña', forgotPassword: '¿Olvidaste tu contraseña?',
      resetPassword: 'Restablecer Contraseña', newPassword: 'Nueva Contraseña',
      currentPassword: 'Contraseña Actual', changePassword: 'Cambiar Contraseña',
      twoFactor: 'Autenticación de Dos Factores', enterCode: 'Ingresa el código de 6 dígitos',
      // Status
      active: 'Activo', inactive: 'Inactivo', pending: 'Pendiente', cancelled: 'Cancelado',
      // Modules  
      name: 'Nombre', status: 'Estado', priority: 'Prioridad', department: 'Departamento',
      startDate: 'Fecha inicio', endDate: 'Fecha fin', budget: 'Presupuesto', progress: 'Progreso',
      assignedTo: 'Asignado a', createdAt: 'Creado', description: 'Descripción',
    },
  },
  fr: {
    translation: {
      dashboard: 'Tableau de bord', leads: 'Prospects', deals: 'Affaires', contacts: 'Contacts',
      accounts: 'Comptes', users: 'Utilisateurs', roles: 'Rôles', calls: 'Appels',
      emails: 'E-mails', meetings: 'Réunions', tickets: 'Tickets', tasks: 'Tâches',
      employees: 'Employés', projects: 'Projets', calendar: 'Calendrier',
      emailTemplates: 'Modèles d\'E-mail', versionHistory: 'Historique des versions',
      add: 'Ajouter', edit: 'Modifier', delete: 'Supprimer', save: 'Enregistrer', cancel: 'Annuler',
      search: 'Rechercher', filter: 'Filtrer', export: 'Exporter', import: 'Importer',
      refresh: 'Actualiser', view: 'Voir', close: 'Fermer', confirm: 'Confirmer',
      loading: 'Chargement...', noRecords: 'Aucun enregistrement', actions: 'Actions',
      signIn: 'Se connecter', signOut: 'Se déconnecter', register: "S'inscrire",
      email: 'Adresse e-mail', password: 'Mot de passe', forgotPassword: 'Mot de passe oublié?',
      name: 'Nom', status: 'Statut', priority: 'Priorité', description: 'Description',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'crm_language',
    },
  });

export default i18n;
