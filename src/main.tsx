import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MantineProvider>
        <Notifications position="bottom-right" />
        <App />
      </MantineProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
