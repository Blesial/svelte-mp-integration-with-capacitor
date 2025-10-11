# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.


    Implementado:

  - ✅ .env con credenciales reales del marketplace
  - ✅ /api/mp/oauth/start → Redirige a MP con CSRF state
  - ✅ /api/mp/oauth/callback → Intercambia code, obtiene user data, guarda en DB
  - ✅ /seller/connect → UI para iniciar OAuth
  - ✅ /seller/connected → Confirmación de conexión exitosa
  - ✅ /api/mp/sellers → Lista sellers conectados (para debug)


  - ✅ /api/mp/create-preference → Crea preferencias con marketplace_fee
    - Usa access_token del SELLER (no del marketplace)
    - Calcula comisión dinámicamente (5% configurable)
    - back_urls detectan app vs web automáticamente
    - Refresh automático de tokens si expiraron

  - ✅ Home (/+page.svelte) → UI completa para pagos
    - Lista sellers conectados
    - Selector de seller
    - Input de monto y producto
    - Muestra desglose: Total, Comisión, Seller recibe
    - Botón "Pagar con Mercado Pago"
    - Detección de Capacitor para usar Browser.open

  - ✅ @capacitor/browser instalado