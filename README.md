# CLIPRD

Plataforma de control para la agencia Origen Simple. Convierte visualizaciones en dinero: clips de TikTok y YouTube, tarifas por cada mil vistas y un libro de pagos que no vuelve a contar lo ya liquidado.

Esta aplicación corre en el stack de publicación del producto: TanStack Start, React, TypeScript, Tailwind, Postgres y Better Auth. Al publicar, la base es Neon Postgres en Vercel. No usa Supabase; la autorización equivalente a RLS está en cada función de servidor, atada a la sesión, porque la app se conecta como dueña de la base.

## Cuentas

- La primera persona que completa la ficha queda como administrador de Origen Simple.
- Las siguientes entran como clippers pendientes, salvo que usen una invitación de un solo uso.
- Se puede entrar con correo y contraseña, Google o X.
- No hay correo de recuperación: no hay un proveedor de email configurado. No se simula.

## Variables de entorno del servidor

No las pongas en el frontend. No hay archivo `.env` en este proyecto: al publicar se inyectan en el servidor.

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | La inyecta la plataforma al publicar. |
| `YOUTUBE_API_KEY` | YouTube Data API v3. Método `videos.list` con `snippet`, `contentDetails`, `statistics`, `status`. Sin ella no hay vistas verificadas. |
| `TIKTOK_CLIENT_KEY` | App de TikTok. No basta para ver reproducciones. |
| `TIKTOK_CLIENT_SECRET` | Secreto de esa app. |
| `CRON_SECRET` | `POST /api/cron/sync` con `Authorization: Bearer <secreto>`. Sin ella el endpoint responde 503. |

YouTube: Google Cloud → activa YouTube Data API v3 → crea una API key. Cada consulta cuesta 1 unidad. CLIPRD se detiene cerca de 9,500 unidades al día.

TikTok: la API oficial exige una app aprobada y OAuth de cada cuenta. Hasta entonces CLIPRD solo valida el enlace y, si responde, el oEmbed público (título y autor). Eso no es una estadística de vistas y no se presenta como verificada.

## Motor

Ganancia = (vistas válidas nuevas / 1,000) × tarifa vigente. La tarifa queda copiada en el movimiento. 58,000 TikTok a US$0.30 = US$17.40; 40,000 Shorts a US$0.80 = US$32.00; 20,000 videos a US$1.50 = US$30.00. Total US$79.40. Una sincronización posterior solo liquida la diferencia.

Un ajuste manual exige justificación y queda marcado como ajuste, no como dato de API.

## Pagos

Transferencia manual, de inicio hacia Banco Popular Dominicano u otro banco que registre el clipper. El botón registra la referencia y un enlace de comprobante. No habla con el banco.

## Rutas

`/login`, `/register`, `/dashboard`, `/admin`, `/admin/clippers`, `/admin/clips`, `/admin/payments`, `/admin/rates`, `/admin/reports`, `/admin/settings`, `/clipper/dashboard`, `/clipper/my-clips`, `/clipper/register-clip`, `/clipper/earnings`, `/clipper/payments`, `/clipper/profile`, `/ranking`, `/politicas`.
