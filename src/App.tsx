import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ConfirmDialogHost } from '@/components/ui/ConfirmDialogHost'
import Landing from '@/routes/Landing'
import Login from '@/routes/Login'
import NotFound from '@/routes/NotFound'
import RequireAuth from '@/routes/app/RequireAuth'
import CatalogList from '@/routes/app/CatalogList'
import CatalogDetail from '@/routes/app/CatalogDetail'
import ProductStepper from '@/routes/app/ProductStepper'

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster theme="system" richColors position="top-center" />
      <ConfirmDialogHost />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route path="/app" element={<RequireAuth />}>
            <Route index element={<CatalogList />} />
            <Route path="catalog/:catalogId" element={<CatalogDetail />} />
            <Route path="catalog/:catalogId/product/new" element={<ProductStepper />} />
            <Route path="catalog/:catalogId/product/:productId" element={<ProductStepper />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
