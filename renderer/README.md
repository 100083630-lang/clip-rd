# CLIPRD Renderer

Servicio pesado para Google Cloud Run. Procesa únicamente fuentes de video que controles o tengas autorización para procesar.

## Variables

- CLIPRD_RENDERER_TOKEN
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- CLIPRD_STORAGE_BUCKET=cliprd-renders

## Deploy

```bash
gcloud run deploy cliprd-renderer --source ./renderer --region us-east1 --allow-unauthenticated
```

Después guarda la URL del servicio en Vercel como `CLIPRD_RENDERER_URL` con el sufijo `/jobs`, y usa el mismo `CLIPRD_RENDERER_TOKEN` en ambos servicios.
