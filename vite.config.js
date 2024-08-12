import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue"

export default defineConfig({
    base: '/whereismyfun42/',
    plugins: [vue()],
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],  // Ensure these assets are included in the build

})