import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import { CartProvider } from './context/CartContext'

import Nav            from './components/Nav'
import Hero           from './components/Hero'
import Marquee        from './components/Marquee'
import Stats          from './components/Stats'
import Signature      from './components/Signature'
import Gallery        from './components/Gallery'
import DeliveryBanner from './components/DeliveryBanner'
import Hours          from './components/Hours'
import Contact        from './components/Contact'
import Footer         from './components/Footer'

// Shop + delivery flow and error pages load on demand to keep the landing lean.
const MenuPage      = lazy(() => import('./pages/MenuPage'))
const CartPage      = lazy(() => import('./pages/CartPage'))
const CheckoutPage  = lazy(() => import('./pages/CheckoutPage'))
const OrderTrackPage = lazy(() => import('./pages/OrderTrackPage'))
const NotFound      = lazy(() => import('./pages/errors/NotFound'))

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <span className="page-loader-glyph">J</span>
    </div>
  )
}

function HomePage() {
  return (
    <div className="wrapper">
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Stats />
        <Signature />
        <Gallery />
        <DeliveryBanner />
        <Hours />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"            element={<HomePage />} />
            <Route path="/menu"        element={<MenuPage />} />
            <Route path="/cart"        element={<CartPage />} />
            <Route path="/checkout"    element={<CheckoutPage />} />
            <Route path="/order/:id"   element={<OrderTrackPage />} />
            <Route path="*"            element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </CartProvider>
  )
}
