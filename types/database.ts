/**
 * Database Type Definitions
 * 
 * TypeScript interfaces for Supabase database tables
 */

export interface Game {
  id: string;
  name: string;
  currency_name: string;
  current_rate: number;
  rate_unit: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Earning {
  id: string;
  user_id: string;
  game_id: string;
  amount_farmed: number;
  applied_rate: number;
  net_income: number;
  status: "pending" | "approved" | "rejected" | "paid";
  created_at: string;
  games?: {
    name: string;
    currency_name?: string;
  };
  users?: {
    name: string;
  };
}

export interface InventoryNeed {
  id: string;
  user_id: string;
  item_name: string;
  status: "pending" | "approved" | "fulfilled" | "rejected";
  created_at: string;
  updated_at: string;
  users?: {
    name: string;
  };
}

export interface User {
  id: string;
  name: string;
  role: "admin" | "employee" | "pending";
  created_at?: string;
}

/**
 * Form data interface for creating a new earning record
 * Used in the admin dashboard earning form
 */
export interface EarningFormData {
  user_id: string;
  game_id: string;
  amount_farmed: number;
  applied_rate: number;
  net_income: number;
}