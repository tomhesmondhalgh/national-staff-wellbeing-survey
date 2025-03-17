
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log(`Building application in ${mode} mode`);
  
  // Apply different configurations based on the build mode
  const isStaging = mode === 'staging';
  const isDevelopment = mode === 'development';
  
  return {
    define: {
      // This allows us to access the mode in the application
      'import.meta.env.VITE_ENV': JSON.stringify(mode),
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      (isDevelopment || isStaging) &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Add build-specific configurations
    build: {
      sourcemap: isStaging || isDevelopment,
      // Cleanup the console in production
      minify: mode === 'production',
    },
  };
});
