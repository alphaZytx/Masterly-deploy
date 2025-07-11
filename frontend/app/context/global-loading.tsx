import { createContext, useContext, useState } from 'react'

export const GlobalLoadingContext = createContext({
  isLoading: false,
  setLoading: (v: boolean) => {}
})

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setLoading] = useState(false)
  return (
    <GlobalLoadingContext.Provider value={{ isLoading, setLoading }}>
      <GlobalLoadingOverlay />
      {children}
    </GlobalLoadingContext.Provider>
  )
}

export function GlobalLoadingOverlay() {
  const { isLoading } = useContext(GlobalLoadingContext)
  if (!isLoading) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-xl flex flex-col items-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Loading next chapter...</h2>
      </div>
    </div>
  )
} 