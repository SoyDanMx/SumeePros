# Configuración de Variables de Entorno

Para desarrollo local, crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```
EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui

# Google Maps API Key (Opcional - para ETA preciso con tráfico)
# Si no se proporciona, el sistema usará cálculo simple (Haversine)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

## ⚠️ Importante: Obtener Credenciales

### **Supabase:**
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Settings** → **API**
3. Copia:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Pasos para crear el archivo .env:

1. En la raíz del proyecto, crea un archivo llamado `.env`
2. Copia y pega el contenido de arriba
3. Guarda el archivo

El archivo `.env` ya está en `.gitignore`, por lo que no se subirá al repositorio.

## Configuración de Google Maps API (Opcional)

Para obtener ETA preciso con tráfico en tiempo real:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Maps JavaScript API** y **Directions API**
4. Crea credenciales (API Key)
5. Agrega la API key a `.env` como `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
6. (Recomendado) Restringe la API key a tu dominio/app

**Nota:** Sin la API key, el sistema funcionará con cálculo simple basado en distancia en línea recta y velocidad promedio.



