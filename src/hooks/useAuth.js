import { useContext } from 'react'
import { AuthContext } from '@/context/authContextObject'

// Usage: const { user, login, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
