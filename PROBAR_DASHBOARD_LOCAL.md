# Cómo probar el Dashboard LOCALMENTE (Sin subir nada)

Para editar tu portafolio usando el panel de administración directamente en tu computadora, necesitas 2 cosas pequeñas que se ejecutan en la terminal (Node.js).

## Paso 1: Abrir la carpeta en Terminal
Abre PowerShell o Git Bash en la carpeta `portfolio antigravity`.

## Paso 2: Iniciar el Proxy de Archivos (Para poder GUARDAR)
Este comando permite que el navegador escriba cambios en tu disco duro (`projects.json`).
Ejecuta:
```bash
npx decap-server
```
*(Déjalo corriendo, no cierres esta ventana)*.

## Paso 3: Iniciar el Servidor Web (Para poder VER)
Abre **otra** ventana de terminal en la misma carpeta.
Ejecuta:
```bash
npx http-server .
```
*(Si te pide instalar, dale a 'y' enter)*.

## Paso 4: ¡Entrar!
Ahora ve a tu navegador y entra a:
👉 **http://localhost:8080/admin**

Verás el panel. Todo lo que edites ahí se guardará automáticamente en tu archivo `assets/projects.json`.
