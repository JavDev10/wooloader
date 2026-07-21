import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PackagePlus, Upload, Table2, Layers } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { DEMO_MODE } from '@/lib/config'

export default function Landing() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg font-bold">
          <PackagePlus size={22} className="text-accent-ink" /> WooLoader
        </div>
        <ThemeToggle />
      </div>

      <h1 className="mt-10 font-display text-4xl font-bold leading-tight sm:text-5xl">
        Cargá tu catálogo de productos y exportalo a WooCommerce en minutos.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        Una interfaz visual simple para armar productos —simples o con variantes, imágenes y precios—
        y bajar un CSV listo para el importador nativo de WooCommerce. Open source y autohospedable.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/login"
          className="rounded-md bg-accent px-5 py-3 font-semibold text-on-accent hover:opacity-90"
        >
          {DEMO_MODE ? 'Probar la demo' : 'Ingresar'}
        </Link>
        <a
          href="https://github.com"
          className="rounded-md border border-line px-5 py-3 font-medium text-fg hover:bg-elevated"
        >
          Ver en GitHub
        </a>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        <Feature icon={<Layers size={20} />} title="Productos con variantes">
          Definí atributos (Color, Talla…) y generá todas las combinaciones con su precio y stock.
        </Feature>
        <Feature icon={<Upload size={20} />} title="Imágenes optimizadas">
          Subí fotos que se recortan y comprimen solas para que importen sin problemas.
        </Feature>
        <Feature icon={<Table2 size={20} />} title="CSV nativo de WooCommerce">
          Exportá un archivo compatible con el importador de productos, sin plugins raros.
        </Feature>
      </div>
    </div>
  )
}

function Feature({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line p-5">
      <div className="text-accent-ink">{icon}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-faint">{children}</p>
    </div>
  )
}
