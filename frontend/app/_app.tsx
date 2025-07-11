import '../styles/globals.css'
import { GlobalLoadingProvider } from './context/global-loading'

function MyApp({ Component, pageProps }) {
  return (
    <GlobalLoadingProvider>
      <Component {...pageProps} />
    </GlobalLoadingProvider>
  )
}

export default MyApp 