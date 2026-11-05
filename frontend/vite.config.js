import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Fitted is a "multi-page app" (MPA) as far as Vite is concerned.
// Home, About, and Contact are traditional static HTML/CSS/JS pages, while
// App and Login are React single-page apps that each get their own HTML
// entry point. Vite lets us build all five pages together into one `dist`
// folder, which keeps deployment simple (see DockerContainer/).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        about: resolve(__dirname, "about.html"),
        contact: resolve(__dirname, "contact.html"),
        app: resolve(__dirname, "app.html"),
        login: resolve(__dirname, "login.html"),
      },
    },
  },
});
