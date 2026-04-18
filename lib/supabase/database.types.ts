export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      businesses: {
        Row: {
          created_at: string;
          currency: string;
          currency_symbol: string;
          id: string;
          industry: string | null;
          low_stock_default: number;
          name: string;
          owner_id: string;
          theme: Json;
          variance_threshold: number;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          currency_symbol?: string;
          id?: string;
          industry?: string | null;
          low_stock_default?: number;
          name: string;
          owner_id: string;
          theme?: Json;
          variance_threshold?: number;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
        Relationships: [];
      };
      expense_categories: {
        Row: { business_id: string; created_at: string; id: string; name: string };
        Insert: { business_id: string; created_at?: string; id?: string; name: string };
        Update: Partial<Database["public"]["Tables"]["expense_categories"]["Insert"]>;
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          business_id: string;
          category_id: string | null;
          created_at: string;
          created_by: string | null;
          expense_date: string;
          external_ref: string | null;
          id: string;
          note: string | null;
          ref_no: string;
        };
        Insert: {
          amount: number;
          business_id: string;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          expense_date?: string;
          external_ref?: string | null;
          id?: string;
          note?: string | null;
          ref_no: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [];
      };
      memberships: {
        Row: {
          business_id: string;
          created_at: string;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["memberships"]["Insert"]>;
        Relationships: [];
      };
      product_categories: {
        Row: { business_id: string; created_at: string; id: string; name: string };
        Insert: { business_id: string; created_at?: string; id?: string; name: string };
        Update: Partial<Database["public"]["Tables"]["product_categories"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          business_id: string;
          category_id: string | null;
          cost: number;
          created_at: string;
          id: string;
          is_active: boolean;
          low_stock_threshold: number;
          name: string;
          price: number;
          sku: string;
          stock: number;
          unit: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          category_id?: string | null;
          cost?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          low_stock_threshold?: number;
          name: string;
          price: number;
          sku: string;
          stock?: number;
          unit?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      reconciliation_items: {
        Row: {
          actual_qty: number;
          expected_qty: number;
          id: string;
          note: string | null;
          product_id: string;
          snapshot_id: string;
          variance: number | null;
        };
        Insert: {
          actual_qty: number;
          expected_qty: number;
          id?: string;
          note?: string | null;
          product_id: string;
          snapshot_id: string;
          variance?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["reconciliation_items"]["Insert"]>;
        Relationships: [];
      };
      reconciliation_snapshots: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          note: string | null;
          ref_no: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          ref_no: string;
        };
        Update: Partial<Database["public"]["Tables"]["reconciliation_snapshots"]["Insert"]>;
        Relationships: [];
      };
      reference_sequences: {
        Row: { business_id: string; last_counter: number; seq_date: string; seq_type: string };
        Insert: {
          business_id: string;
          last_counter?: number;
          seq_date: string;
          seq_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["reference_sequences"]["Insert"]>;
        Relationships: [];
      };
      stock_movements: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          delta: number;
          id: string;
          product_id: string;
          reason: string | null;
          ref_no: string | null;
          source_id: string | null;
          source_type: Database["public"]["Enums"]["movement_source"];
        };
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          delta: number;
          id?: string;
          product_id: string;
          reason?: string | null;
          ref_no?: string | null;
          source_id?: string | null;
          source_type: Database["public"]["Enums"]["movement_source"];
        };
        Update: Partial<Database["public"]["Tables"]["stock_movements"]["Insert"]>;
        Relationships: [];
      };
      transaction_items: {
        Row: {
          id: string;
          line_discount: number;
          line_total: number;
          product_id: string;
          product_name: string;
          quantity: number;
          transaction_id: string;
          unit_cost: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          line_discount?: number;
          line_total: number;
          product_id: string;
          product_name: string;
          quantity: number;
          transaction_id: string;
          unit_cost: number;
          unit_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["transaction_items"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          amount_tendered: number | null;
          business_id: string;
          cashier_id: string | null;
          change_due: number | null;
          created_at: string;
          destination_account: string | null;
          discount_amount: number;
          discount_type: string | null;
          external_ref: string | null;
          gross_total: number;
          id: string;
          net_total: number;
          notes: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          ref_no: string;
        };
        Insert: {
          amount_tendered?: number | null;
          business_id: string;
          cashier_id?: string | null;
          change_due?: number | null;
          created_at?: string;
          destination_account?: string | null;
          discount_amount?: number;
          discount_type?: string | null;
          external_ref?: string | null;
          gross_total?: number;
          id?: string;
          net_total?: number;
          notes?: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          ref_no: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      user_invites: {
        Row: {
          business_id: string;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          role: Database["public"]["Enums"]["user_role"];
          status: string;
          token: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          status?: string;
          token?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_invites"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      adjust_stock: {
        Args: {
          p_business_id: string;
          p_delta: number;
          p_product_id: string;
          p_reason: string;
          p_source_type: Database["public"]["Enums"]["movement_source"];
        };
        Returns: Database["public"]["Tables"]["stock_movements"]["Row"];
      };
      bootstrap_business: {
        Args: {
          p_currency: string;
          p_full_name: string;
          p_industry: string;
          p_name: string;
          p_symbol: string;
        };
        Returns: Database["public"]["Tables"]["businesses"]["Row"];
      };
      create_reconciliation: {
        Args: { p_business_id: string; p_counts: Json; p_note: string };
        Returns: Database["public"]["Tables"]["reconciliation_snapshots"]["Row"];
      };
      create_sale: {
        Args: {
          p_amount_tendered: number;
          p_business_id: string;
          p_destination_account: string;
          p_discount_amount: number;
          p_discount_type: string;
          p_external_ref: string;
          p_gross_total: number;
          p_items: Json;
          p_net_total: number;
          p_notes: string;
          p_payment_method: Database["public"]["Enums"]["payment_method"];
        };
        Returns: Database["public"]["Tables"]["transactions"]["Row"];
      };
      has_role: {
        Args: { allowed: Database["public"]["Enums"]["user_role"][]; b_id: string };
        Returns: boolean;
      };
      is_member: { Args: { b_id: string }; Returns: boolean };
      next_reference_number: {
        Args: { p_business_id: string; p_type: string };
        Returns: string;
      };
    };
    Enums: {
      movement_source: "sale" | "adjustment" | "restock" | "initial";
      payment_method: "cash" | "gcash" | "maya" | "bank_transfer" | "card" | "other";
      user_role: "owner" | "admin" | "cashier";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
