/**
 * @fileoverview This file defines the roles within the Tradinta application and maps them
 * to a specific set of permissions. It serves as the central authority for the RBAC system.
 */

import { PERMISSIONS } from '@/lib/permissions';

// A type alias for a permission string to improve readability.
export type Permission = string;

// Defines the structure for a single role.
export interface Role {
  name: string;
  description: string;
  permissions: Permission[];
  inherits?: string[]; // Names of other roles to inherit permissions from
}

// A dictionary of all roles in the system.
export const ROLES: Record<string, Role> = {
  // --- Customer-facing Roles ---
  'manufacturer': {
    name: 'Manufacturer',
    description: 'Verified seller on the platform.',
    permissions: [
      PERMISSIONS.PRODUCTS.LIST,
      PERMISSIONS.PRODUCTS.CREATE,
      PERMISSIONS.PRODUCTS.UPDATE,
      PERMISSIONS.PRODUCTS.DELETE,
      PERMISSIONS.PRODUCTS.GENERATE_AI_METADATA,
      PERMISSIONS.SHOP.UPDATE_PROFILE,
      PERMISSIONS.SHOP.UPDATE_POLICIES,
      PERMISSIONS.SHOP.UPDATE_SETTINGS,
      PERMISSIONS.SHOP.VIEW_DASHBOARD,
      PERMISSIONS.QUOTATIONS.VIEW_OWN,
      PERMISSIONS.QUOTATIONS.RESPOND,
    ],
  },
  'buyer': {
    name: 'Buyer',
    description: 'Verified buyer on the platform.',
    permissions: [
      PERMISSIONS.BUYER.VIEW_DASHBOARD,
      PERMISSIONS.BUYER.MANAGE_ORDERS,
      PERMISSIONS.BUYER.MANAGE_WISHLIST,
      PERMISSIONS.BUYER.MANAGE_MESSAGES,
      PERMISSIONS.QUOTATIONS.CREATE,
      PERMISSIONS.QUOTATIONS.VIEW_OWN,
    ],
  },
  'partner': {
    name: 'Growth Partner',
    description: 'Influencers and ambassadors who promote the platform.',
    permissions: [PERMISSIONS.PARTNER.VIEW_DASHBOARD],
  },
  'distributor': {
    name: 'Distributor',
    description: 'Verified reseller who buys in bulk and sells to other businesses.',
    inherits: ['buyer'], // Distributors are fundamentally buyers
    permissions: [
      PERMISSIONS.DISTRIBUTOR.VIEW_DASHBOARD,
    ],
  },

  // --- Administrative Roles ---
  'support': {
    name: 'Support',
    description: 'Handles customer tickets and basic user issues.',
    permissions: [
      PERMISSIONS.USERS.LIST,
      PERMISSIONS.USERS.VIEW_DETAILS,
      PERMISSIONS.DISPUTES.VIEW_ALL,
      PERMISSIONS.DISPUTES.MEDIATE,
    ],
  },
  'user-management': {
    name: 'User Management',
    description: 'Manages user accounts, roles, and status.',
    inherits: ['support'],
    permissions: [
      PERMISSIONS.USERS.CREATE,
      PERMISSIONS.USERS.UPDATE_ROLE,
      PERMISSIONS.USERS.UPDATE_STATUS,
      PERMISSIONS.USERS.SEND_PASSWORD_RESET,
    ],
  },
  'operations-manager': {
    name: 'Operations Manager',
    description: 'Oversees daily marketplace functions.',
    inherits: ['user-management'],
    permissions: [
      PERMISSIONS.VERIFICATIONS.VIEW_QUEUE,
      PERMISSIONS.VERIFICATIONS.APPROVE,
      PERMISSIONS.VERIFICATIONS.REJECT,
      PERMISSIONS.VERIFICATIONS.RESTRICT,
      PERMISSIONS.ORDERS.VIEW_ALL,
      PERMISSIONS.ORDERS.UPDATE_STATUS,
      PERMISSIONS.SYSTEM.VIEW_ACTIVITY_LOG,
      PERMISSIONS.SYSTEM.VIEW_PLATFORM_HEALTH,
    ],
  },
  'content-management': {
    name: 'Content Management',
    description: 'Manages all site content like banners and blog posts.',
    permissions: [
      PERMISSIONS.CONTENT.MANAGE_BANNERS,
      PERMISSIONS.CONTENT.MANAGE_BLOG_POSTS,
      PERMISSIONS.CONTENT.MANAGE_SITE_PAGES,
    ],
  },
  'marketing-manager': {
    name: 'Marketing Manager',
    description: 'Manages marketing campaigns and the ambassador network.',
    inherits: ['content-management'],
    permissions: [
      PERMISSIONS.MARKETING.VIEW_DASHBOARD,
      PERMISSIONS.MARKETING.MANAGE_CAMPAIGNS,
      PERMISSIONS.MARKETING.MANAGE_AMBASSADORS,
      PERMISSIONS.MARKETING.MANAGE_GROWTH_PLANS,
    ],
  },
  'finance': {
    name: 'Finance',
    description: 'Manages all financial aspects of the platform.',
    permissions: [
      PERMISSIONS.FINANCE.VIEW_DASHBOARD,
      PERMISSIONS.FINANCE.VIEW_TRANSACTIONS,
      PERMISSIONS.FINANCE.MANAGE_PAYOUTS,
      PERMISSIONS.FINANCE.MANAGE_KYC,
      PERMISSIONS.FINANCE.GENERATE_REPORTS,
    ],
  },
   'tradpay-admin': {
    name: 'TradPay Admin',
    description: 'Has special privileges for manual TradPay adjustments.',
    inherits: ['finance'],
    permissions: [
        PERMISSIONS.FINANCE.MANAGE_WALLET_ADJUSTMENTS,
        PERMISSIONS.FINANCE.MANAGE_ESCROW,
    ],
  },
  'tradcoin-airdrop': {
    name: 'TradCoin Airdrop',
    description: 'Manages the TradCoin airdrop phases and rules.',
    permissions: [
        PERMISSIONS.TRADCOIN.VIEW_DASHBOARD,
        PERMISSIONS.TRADCOIN.MANAGE_AIRDROP_PHASES,
        PERMISSIONS.TRADCOIN.MANAGE_CONVERSION_RULES,
    ],
  },
  'tradinta-direct-admin': {
    name: 'Tradinta Direct Admin',
    description: 'Manages B2C orders and fulfillment.',
    permissions: [
      PERMISSIONS.TD_ORDERS.VIEW,
      PERMISSIONS.TD_ORDERS.UPDATE_STATUS,
    ],
  },
  'legal-compliance': {
      name: 'Legal & Compliance',
      description: 'Manages legal documents, KYC standards, and policies.',
      permissions: [
          PERMISSIONS.LEGAL.VIEW_DASHBOARD,
      ],
  },
  'analytics': {
      name: 'Analytics',
      description: 'Views platform-wide analytics and user behavior.',
      permissions: [
        PERMISSIONS.ANALYTICS.VIEW_DASHBOARD,
      ],
  },
  'logistics': {
      name: 'Logistics',
      description: 'Manages shipments and delivery partners.',
      permissions: [
        PERMISSIONS.LOGISTICS.VIEW_DASHBOARD,
      ],
  },
  'admin': {
    name: 'Admin',
    description: 'General administrator with broad access.',
    inherits: ['operations-manager', 'marketing-manager', 'tradpay-admin', 'tradcoin-airdrop', 'tradinta-direct-admin'],
    permissions: [],
  },
  'super-admin': {
    name: 'Super Admin',
    description: 'Has all possible permissions, including system-level ones.',
    permissions: ['*'], // Wildcard for all permissions
  },
};

/**
 * Checks if a user with a given role has a specific permission.
 * This function recursively resolves inherited permissions.
 * @param roleName - The name of the role to check.
 * @param permission - The permission string to check for.
 * @returns `true` if the role has the permission, `false` otherwise.
 */
export function hasPermission(roleName: string, permission: Permission): boolean {
  const role = ROLES[roleName];

  if (!role) {
    // Role does not exist
    return false;
  }

  // Check for wildcard permission
  if (role.permissions.includes('*')) {
    return true;
  }

  // Check if the role has the permission directly
  if (role.permissions.includes(permission)) {
    return true;
  }

  // Check inherited roles recursively
  if (role.inherits) {
    for (const inheritedRoleName of role.inherits) {
      if (hasPermission(inheritedRoleName, permission)) {
        return true;
      }
    }
  }

  return false;
}
