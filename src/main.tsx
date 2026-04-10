import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { clusterApiUrl } from '@solana/web3.js'
import telegramAnalytics from '@telegram-apps/analytics'
import '@solana/wallet-adapter-react-ui/styles.css'
import './index.css'
import App from './App'

const endpoint = import.meta.env.VITE_SOLANA_RPC ?? clusterApiUrl('mainnet-beta')
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()]
const TELEGRAM_ANALYTICS_TOKEN = String(import.meta.env.VITE_TELEGRAM_ANALYTICS_TOKEN ?? '').trim()
const TELEGRAM_ANALYTICS_APP_NAME = String(import.meta.env.VITE_TELEGRAM_ANALYTICS_APP_NAME ?? '').trim()
const TELEGRAM_ANALYTICS_ENV = String(import.meta.env.VITE_TELEGRAM_ANALYTICS_ENV ?? 'PROD').trim().toUpperCase() === 'STG'
  ? 'STG'
  : 'PROD'

const initTelegramAnalytics = async () => {
  const telegramWebApp = (window as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp
  const isTelegramMiniApp = String(telegramWebApp?.initData ?? '').trim().length > 0

  if (!isTelegramMiniApp || !TELEGRAM_ANALYTICS_TOKEN || !TELEGRAM_ANALYTICS_APP_NAME) {
    return
  }

  try {
    await telegramAnalytics.init({
      token: TELEGRAM_ANALYTICS_TOKEN,
      appName: TELEGRAM_ANALYTICS_APP_NAME,
      env: TELEGRAM_ANALYTICS_ENV,
    })
  } catch (error) {
    console.warn('Telegram Analytics init failed:', error)
  }
}

const renderApp = () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <App />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </StrictMode>,
  )
}

void initTelegramAnalytics().finally(renderApp)
