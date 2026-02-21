import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { routeLoadingFallback, router } from './app/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={routeLoadingFallback}>
      <RouterProvider router={router} />
    </Suspense>
  </StrictMode>,
)
