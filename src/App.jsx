import React, { useEffect } from 'react'
import { AppProvider, useApp } from './lib/store.jsx'
import { RouterProvider, useRouter, match } from './lib/router.jsx'
import { TopBar, TabBar, Footer } from './components/Layout.jsx'
import { Toast, Empty } from './components/ui.jsx'
import Home from './pages/Home.jsx'
import Shops from './pages/Shops.jsx'
import Shop from './pages/Shop.jsx'
import Events from './pages/Events.jsx'
import Cart, { OrderDone } from './pages/Cart.jsx'
import Me, { BookingDone } from './pages/Me.jsx'
import { ProductSheet, ServiceSheet, EventSheet } from './pages/sheets.jsx'
import { OwnerToday, OwnerInbox, OwnerEvents, OwnerCatalog, RecommendSheet, QuoteSheet } from './owner/Owner.jsx'

const ROUTES = [
  ['/', () => <Home />],
  ['/shops', () => <Shops />],
  ['/shop/:id', ({ id }) => <Shop key={id} id={id} />],
  ['/ceremonies', () => <Events />],
  ['/cart', () => <Cart />],
  ['/me', () => <Me />],
  ['/order/:ids', ({ ids }) => <OrderDone ids={ids} />],
  ['/booking/:id', ({ id }) => <BookingDone id={id} />],
  ['/owner', () => <OwnerToday />],
  ['/owner/inbox', () => <OwnerInbox />],
  ['/owner/ceremonies', () => <OwnerEvents />],
  ['/owner/catalog', () => <OwnerCatalog />],
]

function Page() {
  const { path } = useRouter()
  const { t } = useApp()
  for (const [pattern, render] of ROUTES) {
    const params = match(pattern, path)
    if (params) return render(params)
  }
  return <Empty icon="search" title={t('nothingYet')} />
}

function Sheets() {
  const { s } = useApp()
  const sh = s.sheet
  if (!sh) return null
  switch (sh.type) {
    case 'product':
      return <ProductSheet key={sh.id} id={sh.id} />
    case 'service':
      return <ServiceSheet key={sh.id} id={sh.id} />
    case 'event':
      return <EventSheet key={sh.id} id={sh.id} />
    case 'recommend':
      return <RecommendSheet key="rec" />
    case 'quote':
      return <QuoteSheet key={sh.id} id={sh.id} />
    default:
      return null
  }
}

function Shell() {
  const { s } = useApp()
  const { path, navigate } = useRouter()

  // Keep the page and the mode in step (e.g. after a reset or a deep link).
  useEffect(() => {
    const ownerPath = path.startsWith('/owner')
    if (s.mode === 'owner' && !ownerPath) navigate('/owner', { replace: true })
    if (s.mode === 'customer' && ownerPath) navigate('/', { replace: true })
  }, [s.mode, path, navigate])

  useEffect(() => {
    document.documentElement.lang = s.lang === 'kr' ? 'ht' : 'en'
  }, [s.lang])

  return (
    <div className="app" data-mode={s.mode}>
      <TopBar />
      <main className="main">
        <div className="container">
          <Page />
        </div>
      </main>
      <Footer />
      <TabBar />
      <Sheets />
      <Toast toast={s.toast} atTop={!!s.sheet} />
    </div>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </RouterProvider>
  )
}
