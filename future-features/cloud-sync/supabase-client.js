// ============================================
// SUPABASE CLIENT FOR EXTENSION (STATIC IMPORTS)
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { config } from './config.js';

class SupabaseClient {
  constructor() {
    this.supabase = null;
    this.user = null;
    this.isInitialized = false;
  }

  // Initialize Supabase client
  async initialize() {
    if (this.isInitialized) return true;

    try {
      if (!config.supabaseUrl || !config.supabaseKey) {
        console.error('❌ Supabase config missing in config.js');
        return false;
      }

      console.log('🔧 Initializing Supabase with URL:', config.supabaseUrl);

      this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
      this.isInitialized = true;

      // Check if user is already logged in
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        this.user = session.user;
        console.log('✅ User already logged in:', this.user.email);
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth event:', event);
        this.user = session?.user || null;
        
        // Notify extension about auth state change
        chrome.runtime.sendMessage({
          action: 'authStateChanged',
          user: this.user
        }).catch(() => {
          // Popup might not be open, that's okay
        });
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Supabase:', error);
      return false;
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
    return data;
  }

  // Sign out
  async signOut() {
    if (!this.supabase) return;
    
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    
    this.user = null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.user;
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // ============================================
  // PRODUCTS API
  // ============================================

  // Fetch all products for current user
  async fetchProducts() {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .order('saved_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Create new product
  async createProduct(product) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await this.supabase
      .from('products')
      .insert([{
        user_id: this.user.id,
        name: product.name,
        url: product.url,
        store: product.store,
        price: product.price,
        numeric_price: product.numericPrice || this.parsePrice(product.price),
        image: product.image,
        images: product.images || [],
        colors: product.colors || [],
        sizes: product.sizes || [],
        material: product.material,
        is_favorite: product.isFavorite || false,
        detection_method: product.detectionMethod,
        detection_confidence: product.detectionConfidence,
        price_history: product.priceHistory || [],
        saved_at: product.savedAt || new Date().toISOString(),
        last_checked: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update existing product
  async updateProduct(id, updates) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await this.supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete product
  async deleteProduct(id) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Check if product exists by URL
  async productExists(url) {
    if (!this.isAuthenticated()) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('products')
      .select('id, price, price_history')
      .eq('url', url)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Update product price and add to history
  async updatePrice(id, newPrice, priceEntry) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    // First, get current price history
    const { data: product } = await this.supabase
      .from('products')
      .select('price_history')
      .eq('id', id)
      .single();

    const updatedHistory = [...(product.price_history || []), priceEntry];

    const { data, error } = await this.supabase
      .from('products')
      .update({
        price: newPrice,
        numeric_price: this.parsePrice(newPrice),
        price_history: updatedHistory,
        updated_at: new Date().toISOString(),
        last_checked: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Toggle favorite
  async toggleFavorite(id, isFavorite) {
    return this.updateProduct(id, { is_favorite: isFavorite });
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  parsePrice(priceStr) {
    if (!priceStr) return 0;
    const cleaned = priceStr.replace(/[,$£€¥₹]/g, '').trim();
    const match = cleaned.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }
}

// Export singleton instance
const supabaseClient = new SupabaseClient();
export default supabaseClient;