# 📱 Capacitor + Deep Links - Guía de Testing

## ✅ Configuración Completada

### Arquitectura implementada:
- **Opción 1: WebView remoto con server.url**
- La app móvil carga el contenido desde: `https://journals-originally-paso-scales.trycloudflare.com`
- SSR funciona completamente (el servidor Node.js está remoto)
- Deep links configurados para capturar: `marketplacepoc://payment/*`

---

## 🔧 Testing en iOS (Xcode)

### 1. Xcode ya debería estar abierto con el proyecto `App.xcworkspace`

### 2. Configurar Signing & Capabilities:
1. Selecciona el target "App" en el navegador de proyectos
2. Ve a la pestaña "Signing & Capabilities"
3. En "Team", selecciona tu equipo de desarrollo de Apple
4. Si no tienes uno, haz clic en "Add Account" y añade tu Apple ID

### 3. Seleccionar destino:
- **Simulador**: Selecciona cualquier iPhone simulator (ej: iPhone 15 Pro)
- **Dispositivo real**: Conecta tu iPhone y selecciónalo en el dropdown

### 4. Ejecutar la app:
1. Presiona el botón ▶️ (Play) en la esquina superior izquierda
2. Xcode compilará y lanzará la app

### 5. Probar el flujo completo:
1. **La app abre** → Verás el home cargando desde el servidor remoto
2. **Ve a "Conectar Seller"** (si no hay sellers conectados)
3. **Autoriza OAuth** → Se abrirá Safari/Browser y volverás a la app
4. **Crear pago** → Presiona "Pagar con Mercado Pago"
5. **Mercado Pago abre** → Completa el pago con tarjeta de prueba
6. **Deep link funciona** → MP redirige a `marketplacepoc://payment/success` y la app vuelve mostrando la página de éxito

---

## 🐛 Troubleshooting

### ❌ "Failed to register bundle identifier"
**Causa**: El bundle ID `com.marketplace.poc` puede estar en uso.
**Solución**:
1. En Xcode, ve a "Signing & Capabilities"
2. Cambia el "Bundle Identifier" a algo único: `com.tuapellido.marketplacepoc`
3. Actualiza también en `capacitor.config.ts`:
```ts
appId: 'com.tuapellido.marketplacepoc',
```
4. Re-sync: `npx cap sync`

### ❌ "The operation couldn't be completed"
**Causa**: Problema con CocoaPods o dependencias.
**Solución**:
```bash
cd ios/App
pod install
cd ../..
```

### ❌ La app no carga contenido
**Causa**: El tunnel de Cloudflare puede haber expirado.
**Solución**:
1. Verifica que el tunnel esté corriendo: `ps aux | grep cloudflared`
2. Si no está, reinícialo:
```bash
cloudflared tunnel --url http://localhost:5173 --protocol http2
```
3. Actualiza la URL en `capacitor.config.ts` si cambió
4. Re-sync: `npx cap sync`

### ❌ Deep links no funcionan
**Causa**: La app no está capturando el scheme.
**Solución**:
1. Verifica que `Info.plist` tenga configurado `CFBundleURLTypes`
2. En iOS 13+, puede necesitar reiniciar el dispositivo/simulador
3. Prueba manualmente: Abre Safari y escribe `marketplacepoc://payment/success` en la barra de direcciones

---

## 🧪 Tarjetas de Prueba (Modo TEST de Mercado Pago)

**⚠️ IMPORTANTE:** Asegúrate de usar credenciales de TEST en el `.env`

| Tarjeta | Número | CVV | Fecha | Resultado |
|---------|---------|-----|-------|-----------|
| Visa aprobada | 4509 9535 6623 3704 | 123 | 11/25 | ✅ Approved |
| Mastercard aprobada | 5031 7557 3453 0604 | 123 | 11/25 | ✅ Approved |
| Visa rechazada | 4013 5406 8274 6260 | 123 | 11/25 | ❌ Rejected |

---

## 📊 Flujo Esperado

```
1. Usuario abre app
   └─> WebView carga: https://journals-originally-paso-scales.trycloudflare.com

2. Usuario conecta seller (OAuth)
   └─> Se abre Browser de Capacitor con URL de MP
   └─> Autoriza y vuelve a la app

3. Usuario crea pago
   └─> POST /api/mp/create-preference
   └─> Se abre Browser con init_point de MP
   └─> Usuario completa pago con tarjeta de prueba

4. Mercado Pago redirige
   └─> Según resultado: marketplacepoc://payment/{success|failure|pending}

5. Deep link listener captura
   └─> src/lib/deeplinks.ts parsea la URL
   └─> goto('/payment/success?payment_id=123')
   └─> Usuario ve página de resultado
```

---

## 🔍 Debugging

### Ver logs de deep links:
1. En Xcode, abre la consola (View → Debug Area → Activate Console)
2. Busca líneas que empiecen con:
   - `🔗 Deep links: Initializing...`
   - `🔗 Deep link received:`
   - `🔗 Navigating to:`

### Ver requests del servidor:
```bash
tail -f /tmp/dev-server.log
```

### Ver estado del tunnel:
```bash
tail -f /tmp/cloudflared-http2.log
```

---

## 🚀 Próximos Pasos (Producción)

Cuando quieras llevar esto a producción:

1. **Cambiar a adapter-static**:
   - Crear build con `@sveltejs/adapter-static`
   - Empaquetar archivos dentro de la app
   - No depender de servidor remoto

2. **Certificados y App Store**:
   - Crear App ID en Apple Developer
   - Configurar Universal Links (alternativa a custom scheme)
   - Subir a TestFlight para testing

3. **Backend productivo**:
   - Desplegar Node.js en servidor real (no Cloudflare tunnel)
   - Usar dominio propio con SSL
   - Configurar CORS correctamente

---

## ✅ Checklist de Testing

- [ ] App compila sin errores en Xcode
- [ ] App abre y carga home correctamente
- [ ] OAuth de seller funciona (Browser abre y vuelve)
- [ ] Lista de sellers aparece en home
- [ ] Botón "Pagar" abre Mercado Pago en Browser
- [ ] Completar pago con tarjeta de prueba
- [ ] Deep link captura redirección de MP
- [ ] Página de éxito/fallo/pendiente se muestra correctamente
- [ ] Browser de MP se cierra automáticamente
- [ ] Logs de console muestran eventos de deep link

---

**¡Listo para probar!** 🎉

Presiona ▶️ en Xcode y sigue el flujo de testing.
