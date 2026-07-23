import { LegalLayout } from '@/routes/legal/LegalLayout'
import { CONTACT_EMAIL, LEGAL_LAST_UPDATED, REPO_URL } from '@/routes/legal/legalMeta'

export default function Terms() {
  return (
    <LegalLayout title="Términos y condiciones">
      <p className="text-sm text-faint">Última actualización: {LEGAL_LAST_UPDATED}</p>

      <h2>1. Qué es WooLoader</h2>
      <p>
        WooLoader es una herramienta para armar catálogos de productos con una interfaz visual y
        exportarlos como un archivo CSV compatible con el importador nativo de WooCommerce. Existe en
        dos formas: como <strong>software de código abierto</strong> que cualquiera puede autohospedar
        (ver el <a href={REPO_URL}>repositorio</a>), y como una <strong>versión online gratuita</strong>{' '}
        hospedada por el autor del proyecto, a la que aplican estos términos.
      </p>

      <h2>2. Aceptación</h2>
      <p>
        Al crear una cuenta, iniciar una sesión de prueba anónima o usar la versión online de
        WooLoader, aceptás estos términos y la{' '}
        <a href="/privacidad">Política de privacidad y cookies</a>. Si no estás de acuerdo, no uses el
        servicio.
      </p>

      <h2>3. Cuentas y sesiones de prueba</h2>
      <ul>
        <li>Sos responsable de mantener la confidencialidad de tus credenciales.</li>
        <li>
          Las <strong>sesiones de prueba anónimas</strong> son temporales: sus datos pueden eliminarse
          en cualquier momento y sin previo aviso.
        </li>
        <li>Podés solicitar la eliminación de tu cuenta y sus datos en cualquier momento (ver contacto).</li>
      </ul>

      <h2>4. Límites del servicio gratuito</h2>
      <p>
        La versión online es gratuita y tiene límites por cuenta (por ejemplo, cantidad máxima de
        productos y catálogos) que pueden mostrarse en la propia aplicación y modificarse en cualquier
        momento. El servicio puede incluir publicidad de terceros para ayudar a sostener los costos.
      </p>

      <h2>5. Tu contenido</h2>
      <ul>
        <li>
          Los datos que cargás (productos, textos, imágenes) son tuyos. WooLoader no reclama ninguna
          propiedad sobre ellos y los usa solo para prestarte el servicio (guardarlos, mostrártelos y
          generar tu CSV).
        </li>
        <li>
          Sos responsable del contenido que subís: declarás tener los derechos necesarios sobre las
          imágenes y textos de tus productos.
        </li>
        <li>
          Las imágenes subidas se sirven mediante URLs públicas (así funciona la importación en
          WooCommerce); no subas imágenes que no quieras que sean accesibles por URL.
        </li>
      </ul>

      <h2>6. Uso aceptable</h2>
      <p>No está permitido usar el servicio para:</p>
      <ul>
        <li>Cargar contenido ilegal, difamatorio, o que infrinja derechos de terceros.</li>
        <li>Intentar eludir los límites, la autenticación o las protecciones del servicio.</li>
        <li>Automatizar la creación masiva de cuentas o sesiones, o degradar el servicio para otros.</li>
      </ul>
      <p>El incumplimiento puede resultar en la suspensión o eliminación de la cuenta y sus datos.</p>

      <h2>7. Software de código abierto</h2>
      <p>
        El código de WooLoader se distribuye bajo la licencia MIT en el{' '}
        <a href={REPO_URL}>repositorio del proyecto</a>. Estos términos aplican al uso de la versión
        online hospedada; el uso del código autohospedado se rige por su licencia.
      </p>

      <h2>8. Disponibilidad y garantías</h2>
      <p>
        El servicio se ofrece <strong>"tal cual"</strong> y <strong>"según disponibilidad"</strong>,
        sin garantías de ningún tipo. Es un proyecto personal gratuito: puede tener interrupciones,
        errores, pérdida de datos o discontinuarse. Hacé una copia de tus catálogos exportando el CSV
        con regularidad.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        En la máxima medida permitida por la ley, el autor del proyecto no será responsable por daños
        indirectos, pérdida de datos, lucro cesante ni perjuicios derivados del uso (o imposibilidad de
        uso) del servicio, incluyendo los resultados de importar el CSV generado en una tienda
        WooCommerce.
      </p>

      <h2>10. Cambios a estos términos</h2>
      <p>
        Estos términos pueden actualizarse. Los cambios relevantes se reflejarán en esta página con una
        nueva fecha de actualización. El uso del servicio después de un cambio implica su aceptación.
      </p>

      <h2>11. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de la República de Chile.</p>

      <h2>12. Contacto</h2>
      <p>
        Por dudas sobre estos términos: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o
        abriendo un issue en el <a href={`${REPO_URL}/issues`}>repositorio</a>.
      </p>
    </LegalLayout>
  )
}
