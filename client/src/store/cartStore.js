import { create } from 'zustand'
import api from '../lib/axios'
import toast from 'react-hot-toast'

const useCartStore = create((set, get) => ({
  cart: null,
  items: [],
  pricing: {},
  isLoading: false,
  itemCount: 0,

  fetchCart: async () => {
    try {
      const { data } = await api.get('/cart')
      const cart = data.data.cart
      set({
        cart,
        items: cart?.items || [],
        pricing: cart?.pricing || {},
        itemCount: cart?.items?.reduce((sum, i) => sum + i.qty, 0) || 0,
      })
    } catch { /* silent fail */ }
  },

  addToCart: async (productId, variantId, qty = 1, lensOption = null) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/cart/add', { productId, variantId, qty, lensOption })
      const cart = data.data.cart
      set({
        cart,
        items: cart.items,
        pricing: cart.pricing,
        itemCount: cart.items.reduce((sum, i) => sum + i.qty, 0),
        isLoading: false,
      })
      toast.success('Added to cart! 🛒', { icon: '✅' })
      return { success: true }
    } catch (err) {
      set({ isLoading: false })
      toast.error(err.response?.data?.message || 'Failed to add to cart.')
      return { success: false }
    }
  },

  updateItem: async (itemId, qty) => {
    try {
      const { data } = await api.put(`/cart/update/${itemId}`, { qty })
      const cart = data.data.cart
      set({ cart, items: cart.items, pricing: cart.pricing, itemCount: cart.items.reduce((s, i) => s + i.qty, 0) })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.')
    }
  },

  removeItem: async (itemId) => {
    try {
      const { data } = await api.delete(`/cart/remove/${itemId}`)
      const cart = data.data.cart
      set({ cart, items: cart.items, pricing: cart.pricing, itemCount: cart.items.reduce((s, i) => s + i.qty, 0) })
      toast.success('Item removed.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Remove failed.')
    }
  },

  applyCoupon: async (code) => {
    try {
      const { data } = await api.post('/cart/coupon', { code })
      const cart = data.data.cart
      set({ cart, pricing: cart.pricing })
      toast.success(data.message)
      return { success: true }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon.')
      return { success: false }
    }
  },

  removeCoupon: async () => {
    try {
      const { data } = await api.delete('/cart/coupon')
      const cart = data.data.cart
      set({ cart, pricing: cart.pricing })
    } catch { /* ignore */ }
  },

  clearCart: () => set({ cart: null, items: [], pricing: {}, itemCount: 0 }),
}))

export default useCartStore
