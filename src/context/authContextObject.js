import { createContext } from 'react'

// Kept in its own file so React's fast refresh works on AuthContext.jsx
export const AuthContext = createContext(null)
