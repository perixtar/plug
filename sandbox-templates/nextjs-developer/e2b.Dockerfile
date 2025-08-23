# You can use most Debian-based base images
FROM node:21-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Install dependencies and customize sandbox
WORKDIR /home/user/nextjs-app

RUN npx create-next-app@15.4.4 . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --app --no-src-dir --turbopack
# Install deps
RUN npm install

# Copy custom files
COPY layout.tsx app/layout.tsx
COPY PostHogProviderWrapper.tsx app/PostHogProviderWrapper.tsx
COPY config/firebase-admin-config.ts config/firebase-admin-config.ts
# COPY config/excel-firebase-admin-config.ts config/excel-firebase-admin-config.ts

RUN npm install tailwindcss @tailwindcss/postcss postcss
RUN npx shadcn@2.10.0 init -b neutral
RUN npx shadcn@2.10.0 add --all
RUN npm install posthog-js

# Should we install this and supabase dependency in sandbox directly only when
# user selected to use Firestore
RUN npm install firebase-admin 

# Move the Nextjs app to the home directory and remove the nextjs-app directory
RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app
