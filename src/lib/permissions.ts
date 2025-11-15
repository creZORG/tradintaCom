
/**
 * @fileoverview This file contains a comprehensive list of all possible permissions (actions)
 * that can be performed within the Tradinta application. It serves as the single source of truth
 * for the Role-Based Access Control (RBAC) system.
 *
 * The permissions are structured as "resource:action:scope" (e.g., "products:create", "users:update:role").
 * This categorization makes the permissions self-describing and easier to manage.
 */

export const PERMISSIONS = {
  // --- User & Role Management ---
  USERS: {
    LIST: 'users:list',                 // View the list of all users
    VIEW_DETAILS: 'users:view_details', // View the detailed profile of any user
    CREATE: 'users:create',             // Create a new user account
    UPDATE_ROLE: 'users:update:role',   // Change a user's role
    UPDATE_STATUS: 'users:update:status',// Suspend or unsuspend a user account
    SEND_PASSWORD_RESET: 'users:send_password_reset', // Trigger a password reset for a user
    DELETE: 'users:delete',             // Permanently delete a user
  },

  // --- Manufacturer (Seller) Product Management ---
  PRODUCTS: {
    LIST: 'products:list',           // View the seller's own list of products
    CREATE: 'products:create',       // Create a new product listing
    UPDATE: 'products:update',       // Update an existing product
    DELETE: 'products:delete',       // Delete a product (archive/soft delete)
    VIEW_ANALYTICS: 'products:view:analytics', // View performance analytics for a product
    GENERATE_AI_METADATA: 'products:generate_ai_metadata', // Use the AI tagging feature
  },

  // --- Manufacturer (Seller) Profile Management ---
  SHOP: {
    UPDATE_PROFILE: 'shop:update:profile',  // Update the seller's public shop profile (branding, info)
    UPDATE_POLICIES: 'shop:update:policies',// Update shop policies (payment, shipping, return)
    UPDATE_SETTINGS: 'shop:update:settings',// Update shop settings (TradPay, TradPoints)
    UPDATE_KRA_PIN: 'shop:update:kra_pin', // Update the KRA PIN before verification
    UPDATE_LOGO: 'shop:update:logo', // Update the shop logo
    VIEW_DASHBOARD: 'shop:view:dashboard', // Access the Seller Centre dashboard
    CUSTOM_THEME: 'shop:custom_theme',   // Access to premium shop profile themes
  },

  // --- Buyer-Specific Actions ---
  BUYER: {
    VIEW_DASHBOARD: 'buyer:view:dashboard', // Access the Buyer dashboard
    MANAGE_ORDERS: 'buyer:manage:orders',   // View and track own orders
    MANAGE_WISHLIST: 'buyer:manage:wishlist', // Add/remove items from wishlist
    MANAGE_MESSAGES: 'buyer:manage:messages', // View and respond to messages
  },

  // --- Distributor-Specific Actions ---
  DISTRIBUTOR: {
    VIEW_DASHBOARD: 'distributor:view:dashboard',
  },

  // --- Growth Partner-Specific Actions ---
  PARTNER: {
    VIEW_DASHBOARD: 'partner:view:dashboard',
  },

  // --- Quotation (RFQ) Management ---
  QUOTATIONS: {
    CREATE: 'quotations:create', // Buyer action: Request a new quotation
    VIEW_OWN: 'quotations:view:own', // Buyer/Seller: View RFQs they are part of
    RESPOND: 'quotations:respond', // Seller action: Respond to an RFQ
  },

  // --- Order Management ---
  ORDERS: {
    VIEW_ALL: 'orders:view:all',       // Admin/Ops action: View all orders on the platform
    UPDATE_STATUS: 'orders:update:status', // Admin/Ops action: Manually update order status
  },

  // --- B2C Order Management ---
  TD_ORDERS: {
    VIEW: 'td_orders:view',
    UPDATE_STATUS: 'td_orders:update:status',
  },

  // --- Content Management (Banners, Blog, Pages) ---
  CONTENT: {
    MANAGE_BANNERS: 'content:manage:banners', // Create, update, delete homepage banners
    MANAGE_BLOG_POSTS: 'content:manage:blog_posts', // Create, update, delete blog posts
    MANAGE_SITE_PAGES: 'content:manage:site_pages', // Create, update, delete static pages (About Us, etc.)
  },

  // --- Verification & Compliance ---
  VERIFICATIONS: {
    VIEW_QUEUE: 'verifications:view:queue', // View the list of pending verifications
    APPROVE: 'verifications:approve',       // Approve a seller/buyer application
    REJECT: 'verifications:reject',         // Reject a seller/buyer application
    RESTRICT: 'verifications:restrict',     // Restrict an already verified seller
  },

  // --- Dispute Resolution ---
  DISPUTES: {
    VIEW_ALL: 'disputes:view:all',   // View all open disputes
    MEDIATE: 'disputes:mediate',     // Take action on a dispute (e.g., change status, message parties)
  },

  // --- Financial & TradPay Management ---
  FINANCE: {
    VIEW_DASHBOARD: 'finance:view:dashboard',         // Access the finance dashboard
    VIEW_TRANSACTIONS: 'finance:view:transactions',   // View all platform transactions
    MANAGE_PAYOUTS: 'finance:manage:payouts',         // Approve or reject seller payout requests
    MANAGE_KYC: 'finance:manage:kyc',                 // Review and manage KYC documents
    GENERATE_REPORTS: 'finance:generate:reports',     // Generate financial reports
    MANAGE_WALLET_ADJUSTMENTS: 'finance:manage:wallet_adjustments', // Manually adjust user TradPay wallets
    MANAGE_ESCROW: 'finance:manage:escrow',           // Manually manage escrow releases
  },

  // --- Marketing Management ---
  MARKETING: {
    VIEW_DASHBOARD: 'marketing:view:dashboard',
    MANAGE_CAMPAIGNS: 'marketing:manage:campaigns',     // Create and manage platform-wide ad campaigns
    MANAGE_AMBASSADORS: 'marketing:manage:ambassadors', // Manage the Growth Partner network
    MANAGE_GROWTH_PLANS: 'marketing:manage:growth_plans', // Manage the pricing and features of marketing plans
  },

  // --- TradCoin Airdrop Management ---
  TRADCOIN: {
    VIEW_DASHBOARD: 'tradcoin:view:dashboard',
    MANAGE_AIRDROP_PHASES: 'tradcoin:manage:airdrop_phases', // Start, stop, or configure airdrop phases
    MANAGE_CONVERSION_RULES: 'tradcoin:manage:conversion_rules',// Set the rules for converting TradPoints to TradCoin
  },
  
  // --- Legal and Compliance Dashboard ---
  LEGAL: {
    VIEW_DASHBOARD: 'legal:view:dashboard',
  },
  
  // --- Analytics Dashboard ---
  ANALYTICS: {
    VIEW_DASHBOARD: 'analytics:view:dashboard',
  },

  // --- Logistics Dashboard ---
  LOGISTICS: {
    VIEW_DASHBOARD: 'logistics:view:dashboard',
  },

  // --- Super Admin / System-level Actions ---
  SYSTEM: {
    VIEW_ACTIVITY_LOG: 'system:view:activity_log',      // View the log of all admin actions
    VIEW_PLATFORM_HEALTH: 'system:view:platform_health',// View system health and performance metrics
    MANAGE_GLOBAL_SETTINGS: 'system:manage:global_settings', // Change platform-wide settings (fees, feature flags)
    TOGGLE_MAINTENANCE_MODE: 'system:toggle:maintenance_mode', // Put the site into maintenance mode
  },
};
