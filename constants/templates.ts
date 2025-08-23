import { CodeTemplateMap } from "@/types/code-template";

export const Templates: CodeTemplateMap = {
  "nextjs15-v1": {
    name: "Next.js 15 App Router",
    lib: [
      "nextjs@15.4.4",
      "typescript",
      "@types/node",
      "@types/react",
      "@types/react-dom",
      "postcss",
      "tailwindcss",
      "shadcn",
      "firebase-admin",
    ],
    file: "app/page.tsx",
    instructions:
      "A Next.js 15+ app that reloads automatically. Using the app router.",
    port: 3000,
    envs: [
      "FIREBASE_PROJECT_ID",
      "FIREBASE_ADMIN_CLIENT_EMAIL",
      "FIREBASE_ADMIN_PRIVATE_KEY",
      "NEXT_PUBLIC_APP_URL",
    ],
  },
};
