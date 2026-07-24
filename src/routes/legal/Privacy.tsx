import { useTranslation } from 'react-i18next'
import { LegalLayout } from '@/routes/legal/LegalLayout'
import { usePageTitle } from '@/hooks/usePageTitle'
import { CONTACT_EMAIL, LEGAL_LAST_UPDATED, REPO_URL } from '@/routes/legal/legalMeta'

export default function Privacy() {
  const { t } = useTranslation()
  usePageTitle(t('seo.privacy'))
  return (
    <LegalLayout title="Política de privacidad y cookies">
      <p className="text-sm text-faint">Última actualización: {LEGAL_LAST_UPDATED}</p>

      <p>
        Esta política describe qué datos trata la versión online de WooLoader, para qué, y qué opciones
        tenés. La regla general del proyecto es tratar la <strong>mínima cantidad de datos posible</strong>:
        no vendemos datos, no hacemos perfiles y hoy no usamos cookies de seguimiento propias.
      </p>

      <h2>1. Responsable</h2>
      <p>
        WooLoader es un proyecto personal de código abierto. Para cualquier consulta o solicitud sobre
        tus datos: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li>
          <strong>Cuenta:</strong> tu email y contraseña (la contraseña se almacena con hash por
          Supabase; nunca en texto plano).
        </li>
        <li>
          <strong>Contenido que cargás:</strong> catálogos, productos (nombres, descripciones, precios,
          etc.) y las imágenes que subís. Las imágenes se sirven mediante URLs públicas, como requiere
          la importación en WooCommerce.
        </li>
        <li>
          <strong>Sesiones de prueba anónimas:</strong> se crea un identificador de usuario anónimo, sin
          email. Sus datos son temporales y pueden eliminarse en cualquier momento.
        </li>
        <li>
          <strong>Datos técnicos:</strong> dirección IP y metadatos de las solicitudes, usados por
          nuestros proveedores (hosting y backend) para operar el servicio, aplicar límites de uso y
          prevenir abuso.
        </li>
      </ul>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Prestar el servicio: guardar tus catálogos, mostrártelos y generar tu CSV.</li>
        <li>Autenticarte y mantener tu sesión iniciada.</li>
        <li>Aplicar los límites del plan gratuito y prevenir abuso (rate limiting, CAPTCHA).</li>
      </ul>
      <p>No usamos tus datos para publicidad personalizada ni los compartimos con fines comerciales.</p>

      <h2>4. Dónde se almacenan</h2>
      <p>
        Los datos se almacenan en <strong>Supabase</strong> (base de datos y archivos, en
        infraestructura de AWS, región São Paulo). El sitio se sirve desde <strong>Netlify</strong>.
        Ambos proveedores pueden registrar datos técnicos (como IP) en sus registros de acceso.
      </p>

      <h2>5. Servicios de terceros</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — backend (base de datos, autenticación y archivos).
        </li>
        <li>
          <strong>Netlify</strong> — hosting del sitio.
        </li>
        <li>
          <strong>Cloudflare Turnstile</strong> — verificación anti-bots en el inicio de sesión (cuando
          está activa). Cloudflare procesa datos técnicos de tu navegador para decidir si sos humano.
        </li>
        <li>
          <strong>Cloudflare Web Analytics</strong> — métricas de tráfico agregadas de la versión
          online (páginas vistas, país, tipo de dispositivo). No usa cookies ni identifica visitantes
          individuales.
        </li>
        <li>
          <strong>Google Fonts</strong> — las tipografías se cargan desde servidores de Google, que
          recibe tu IP al servirlas.
        </li>
        <li>
          <strong>Publicidad</strong> — la versión online puede incorporar anuncios de terceros en el
          futuro. Si eso sucede, esta política y la gestión de consentimiento se actualizarán antes,
          porque las redes publicitarias sí usan cookies.
        </li>
      </ul>

      <h2>6. Cookies y almacenamiento local</h2>
      <p>Hoy la aplicación no usa cookies propias de seguimiento. Usa:</p>
      <ul>
        <li>
          <strong>localStorage (esencial):</strong> el token de tu sesión de Supabase (para mantenerte
          conectado) y tu preferencia de tema claro/oscuro.
        </li>
        <li>
          <strong>Cookies de Cloudflare Turnstile (seguridad):</strong> cuando el CAPTCHA está activo,
          Cloudflare puede establecer cookies técnicas necesarias para la verificación.
        </li>
      </ul>
      <p>
        Este almacenamiento es estrictamente necesario para que el servicio funcione, por lo que no
        requiere consentimiento previo. Si en el futuro se incorporan cookies no esenciales (por
        ejemplo, publicidad), se pedirá consentimiento antes de instalarlas.
      </p>

      <h2>7. Cuánto tiempo se conservan</h2>
      <ul>
        <li>
          <strong>Cuentas registradas:</strong> mientras la cuenta exista. Podés borrar tus catálogos y
          productos desde la propia app en cualquier momento, y solicitar la eliminación completa de la
          cuenta por el contacto de abajo.
        </li>
        <li>
          <strong>Sesiones anónimas:</strong> son temporales; sus datos pueden purgarse periódicamente
          sin previo aviso.
        </li>
      </ul>

      <h2>8. Tus derechos</h2>
      <p>
        Podés solicitar acceso, rectificación o eliminación de tus datos escribiendo a{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Al ser un proyecto pequeño, la vía más
        rápida suele ser esa; también podés abrir un issue en el{' '}
        <a href={`${REPO_URL}/issues`}>repositorio</a> para temas no sensibles.
      </p>

      <h2>9. Seguridad</h2>
      <p>
        Todo el tráfico va cifrado por HTTPS. Cada cuenta solo puede acceder a sus propios datos,
        aplicado a nivel de base de datos (row-level security). Aun así, ningún sistema es infalible:
        no cargues información sensible que no sea necesaria para tu catálogo.
      </p>

      <h2>10. Cambios a esta política</h2>
      <p>
        Si esta política cambia de forma relevante, se actualizará esta página con una nueva fecha. Los
        cambios importantes (como incorporar publicidad) se señalizarán en la aplicación.
      </p>
    </LegalLayout>
  )
}
