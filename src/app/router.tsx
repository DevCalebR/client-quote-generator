import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { RouteLoadingState } from './RouteLoadingState'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        lazy: async () => {
          const module = await import('../pages/HomePage')
          return { Component: module.HomePage }
        },
      },
      {
        path: 'intake',
        lazy: async () => {
          const module = await import('../pages/IntakePage')
          return { Component: module.IntakePage }
        },
      },
      {
        path: 'quotes',
        lazy: async () => {
          const module = await import('../pages/QuotesPage')
          return { Component: module.QuotesPage }
        },
      },
      {
        path: 'quote/:id',
        lazy: async () => {
          const module = await import('../pages/QuoteDetailPage')
          return { Component: module.QuoteDetailPage }
        },
      },
      {
        path: 'settings',
        lazy: async () => {
          const module = await import('../pages/SettingsPage')
          return { Component: module.SettingsPage }
        },
      },
      {
        path: '*',
        lazy: async () => {
          const module = await import('../pages/NotFoundPage')
          return { Component: module.NotFoundPage }
        },
      },
    ],
  },
])

export const routeLoadingFallback = <RouteLoadingState />
