// code artifact that will have build error
export const codeArtifactWithBuildError = {
  commentary:
    "I'll help you create a comprehensive feeds page that fetches and displays data from Firestore. Here's what we'll implement:\n\n1. First, we'll set up the necessary types and Firestore configuration\n2. Create a feeds page component with server-side data fetching\n3. Add a FeedCard component for displaying individual feeds\n4. Implement loading and error states\n5. Add responsive styling using Tailwind CSS\n6. Include pagination functionality\n\nLet's break this down into multiple files for better organization.",
  title: 'Feeds Page',
  description:
    'Create a feeds page with Firestore integration and responsive design.',
  additional_dependencies: [],
  has_additional_dependencies: false,
  install_dependencies_command: '',
  code: [
    {
      file_name: 'types.ts',
      file_path: 'app/types/feeds.ts',
      file_content:
        'export interface Feed {\n  id: string;\n  title: string;\n  description: string;\n  imageUrl?: string;\n  author: string;\n  createdAt: Date;\n  category?: string;\n  likes?: number;\n}\n\nexport interface FeedResponse {\n  feeds: Feed[];\n  lastVisible?: any;\n  hasMore: boolean;\n}',
      file_finished: true,
    },
    {
      file_name: 'firebase.ts',
      file_path: 'app/lib/firebase.ts',
      file_content:
        "import { initializeApp, getApps, getApp } from 'firebase/app';\nimport { getFirestore } from 'firebase/firestore';\n\nconst firebaseConfig = {\n  // Replace with your Firebase config\n  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,\n  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,\n  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,\n  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,\n  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,\n  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID\n};\n\nconst app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);\nconst db = getFirestore(app);\n\nexport { db };",
      file_finished: true,
    },
    {
      file_name: 'feedsService.ts',
      file_path: 'app/lib/feedsService.ts',
      file_content:
        "import { getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';\nimport { db } from './firebase';\nimport { Feed, FeedResponse } from '../types/feeds';\n\nconst FEEDS_PER_PAGE = 10;\n\nexport async function getFeeds(page = 1, lastVisible?: any): Promise<FeedResponse> {\n  try {\n    const feedsRef = collection(db, 'feeds');\n    let feedQuery = query(\n      feedsRef,\n      orderBy('createdAt', 'desc'),\n      limit(FEEDS_PER_PAGE)\n    );\n\n    if (lastVisible) {\n      feedQuery = query(feedQuery, startAfter(lastVisible));\n    }\n\n    const snapshot = await getDocs(feedQuery);\n    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];\n    \n    const feeds = snapshot.docs.map(doc => ({\n      id: doc.id,\n      ...doc.data(),\n      createdAt: doc.data().createdAt?.toDate()\n    })) as Feed[];\n\n    return {\n      feeds,\n      lastVisible: lastVisibleDoc,\n      hasMore: feeds.length === FEEDS_PER_PAGE\n    };\n  } catch (error) {\n    console.error('Error fetching feeds:', error);\n    throw error;\n  }\n}",
      file_finished: true,
    },
    {
      file_name: 'FeedCard.tsx',
      file_path: 'app/components/FeedCard.tsx',
      file_content:
        'import { Card, CardHeader, CardTitle, CardDescription, CardContent } from \'@/components/ui/card\';\nimport { Feed } from \'../types/feeds\';\n\ninterface FeedCardProps {\n  feed: Feed;\n}\n\nexport function FeedCard({ feed }: FeedCardProps) {\n  return (\n    <Card className="w-full hover:shadow-lg transition-shadow duration-200">\n      <CardHeader>\n        <CardTitleNotExist className="text-xl">{feed.notExistField}</CardTitleNotExist>\n        <p className="text-sm text-muted-foreground">\n          By {feed.author} · {feed.createdAt.toLocaleDateString()}\n        </p>\n      </CardHeader>\n      <CardContent>\n        <CardDescription className="line-clamp-3">\n          {feed.description}\n        </CardDescription>\n        {feed.imageUrl && (\n          <div className="mt-4">\n            <img\n              src={feed.imageUrl}\n              alt={feed.title}\n              className="w-full h-48 object-cover rounded-md"\n            />\n          </div>\n        )}\n        <div className="mt-4 flex items-center gap-2">\n          {feed.category && (\n            <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">\n              {feed.category}\n            </span>\n          )}\n          {feed.likes !== undefined && (\n            <span className="text-sm text-muted-foreground">\n              {feed.likes} likes\n            </span>\n          )}\n        </div>\n      </CardContent>\n    </Card>\n  );\n}',
      file_finished: true,
    },
    {
      file_name: 'LoadingSkeleton.tsx',
      file_path: 'app/components/LoadingSkeleton.tsx',
      file_content:
        'import { Skeleton } from \'@/components/ui/skeleton\';\n\nexport function LoadingSkeleton() {\n  return (\n    <div className="w-full space-y-4">\n      {[1, 2, 3].map((i) => (\n        <div key={i} className="w-full space-y-4">\n          <Skeleton className="h-8 w-3/4" />\n          <Skeleton className="h-4 w-1/2" />\n          <Skeleton className="h-32 w-full" />\n        </div>\n      ))}\n    </div>\n  );\n}',
      file_finished: true,
    },
    {
      file_name: 'page.tsx',
      file_path: 'app/feeds/page.tsx',
      file_content:
        'import { Suspense } from \'react\';\nimport { getFeeds } from \'../lib/feedsService\';\nimport { FeedCard } from \'../components/FeedCard\';\nimport { LoadingSkeleton } from \'../components/LoadingSkeleton\';\n\nasync function FeedsList() {\n  try {\n    const { feeds } = await getFeeds();\n\n    if (!feeds.length) {\n      return (\n        <div className="text-center py-10">\n          <p className="text-xl text-muted-foreground">No feeds available</p>\n        </div>\n      );\n    }\n\n    return (\n      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n        {feeds.map((feed) => (\n          <FeedCard key={feed.id} feed={feed} />\n        ))}\n      </div>\n    );\n  } catch (error) {\n    console.error(\'Error in FeedsList:\', error);\n    return (\n      <div className="text-center py-10">\n        <p className="text-xl text-red-500">Error loading feeds</p>\n        <button\n          onClick={() => window.location.reload()}\n          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"\n        >\n          Retry\n        </button>\n      </div>\n    );\n  }\n}\n\nexport default function FeedsPage() {\n  return (\n    <div className="container mx-auto px-4 py-8">\n      <h1 className="text-3xl font-bold mb-8">Feeds</h1>\n      <Suspense fallback={<LoadingSkeleton />}>\n        <FeedsList />\n      </Suspense>\n    </div>\n  );\n}',
      file_finished: true,
    },
    // This file intentionally has a build error to demonstrate error handling
    {
      file_name: 'page.tsx',
      file_path: 'app/page.tsx',
      file_content:
        'import {  } from \'react\';\nimport { getFeeds } from \'../lib/feedsService\';\nimport { FeedCard } from \'../components/FeedCard\';\nimport { LoadingSkeleton } from \'../components/LoadingSkeleton\';\n\nasync function FeedsList() {\n  try {\n    const { feeds } = await getFeeds();\n\n    if (!feeds.length) {\n      return (\n        <div className="text-center py-10">\n          <p className="text-xl text-muted-foreground">No feeds available</p>\n        </div>\n      );\n    }\n\n    return (\n      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n        {feeds.map((feed) => (\n          <FeedCard key={feed.id} feed={feed} />\n        ))}\n      </div>\n    );\n  } catch (error) {\n    console.error(\'Error in FeedsList:\', error);\n    return (\n      <div className="text-center py-10">\n        <p className="text-xl text-red-500">Error loading feeds</p>\n        <button\n          onClick={() => window.location.reload()}\n          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"\n        >\n          Retry\n        </button>\n      </div>\n    );\n  }\n}\n\nexport default function FeedsPage() {\n  return (\n    <div className="container mx-auto px-4 py-8">\n      <h1 className="text-3xl font-bold mb-8">Feeds</h1>\n      <Suspense fallback={<LoadingSkeleton />}>\n        <FeedsList />\n      </Suspense>\n    </div>\n  );\n}',
      file_finished: true,
    },
  ],
}

export const codeArtifactWithBuildError2 = {
  commentary:
    "I'll help you create a comprehensive feeds page that fetches and displays data from Firestore. Here's what we'll implement:\n\n1. First, we'll set up the necessary types and Firestore configuration\n2. Create a feeds page component with server-side data fetching\n3. Add a FeedCard component for displaying individual feeds\n4. Implement loading and error states\n5. Add responsive styling using Tailwind CSS\n6. Include pagination functionality\n\nLet's break this down into multiple files for better organization.",
  title: 'Feeds Page',
  description:
    'Create a feeds page with Firestore integration and responsive design.',
  additional_dependencies: [],
  has_additional_dependencies: false,
  install_dependencies_command: '',
  code: [
    {
      file_name: 'types.ts',
      file_path: 'app/types/feeds.ts',
      file_content:
        'export interface Feed {\n  id: string;\n  title: string;\n  description: string;\n  imageUrl?: string;\n  author: string;\n  createdAt: Date;\n  category?: string;\n  likes?: number;\n}\n\nexport interface FeedResponse {\n  feeds: Feed[];\n  lastVisible?: any;\n  hasMore: boolean;\n}',
      file_finished: true,
    },
    {
      file_name: 'firebase.ts',
      file_path: 'app/lib/firebase.ts',
      file_content:
        "import { initializeApp, getApps, getApp } from 'firebase/app';\nimport { getFirestore } from 'firebase/firestore';\n\nconst firebaseConfig = {\n  // Replace with your Firebase config\n  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,\n  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,\n  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,\n  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,\n  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,\n  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID\n};\n\nconst app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);\nconst db = getFirestore(app);\n\nexport { db };",
      file_finished: true,
    },
    {
      file_name: 'feedsService.ts',
      file_path: 'app/lib/feedsService.ts',
      file_content:
        "import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';\nimport { db } from './firebase';\nimport { Feed, FeedResponse } from '../types/feeds';\n\nconst FEEDS_PER_PAGE = 10;\n\nexport async function getFeeds(page = 1, lastVisible?: any): Promise<FeedResponse> {\n  try {\n    const feedsRef = collection(db, 'feeds');\n    let feedQuery = query(\n      feedsRef,\n      orderBy('createdAt', 'desc'),\n      limit(FEEDS_PER_PAGE)\n    );\n\n    if (lastVisible) {\n      feedQuery = query(feedQuery, startAfter(lastVisible));\n    }\n\n    const snapshot = await getDocs(feedQuery);\n    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];\n    \n    const feeds = snapshot.docs.map(doc => ({\n      id: doc.id,\n      ...doc.data(),\n      createdAt: doc.data().createdAt?.toDate()\n    })) as Feed[];\n\n    return {\n      feeds,\n      lastVisible: lastVisibleDoc,\n      hasMore: feeds.length === FEEDS_PER_PAGE\n    };\n  } catch (error) {\n    console.error('Error fetching feeds:', error);\n    throw error;\n  }\n}",
      file_finished: true,
    },
    {
      file_name: 'FeedCard.tsx',
      file_path: 'app/components/FeedCard.tsx',
      file_content:
        'import { Card, CardHeader, CardTitle, CardDescription, CardContent } from \'@/components/ui/card\';\nimport { Feed } from \'../types/feeds\';\n\ninterface FeedCardProps {\n  feed: Feed;\n}\n\nexport function FeedCard({ feed }: FeedCardProps) {\n  return (\n    <Card className="w-full hover:shadow-lg transition-shadow duration-200">\n      <CardHeader>\n        <CardTitle className="text-xl">{feed.title}</CardTitle>\n        <p className="text-sm text-muted-foreground">\n          By {feed.author} · {feed.createdAt.toLocaleDateString()}\n        </p>\n      </CardHeader>\n      <CardContent>\n        <CardDescription className="line-clamp-3">\n          {feed.description}\n        </CardDescription>\n        {feed.imageUrl && (\n          <div className="mt-4">\n            <img\n              src={feed.imageUrl}\n              alt={feed.title}\n              className="w-full h-48 object-cover rounded-md"\n            />\n          </div>\n        )}\n        <div className="mt-4 flex items-center gap-2">\n          {feed.category && (\n            <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">\n              {feed.category}\n            </span>\n          )}\n          {feed.likes !== undefined && (\n            <span className="text-sm text-muted-foreground">\n              {feed.likes} likes\n            </span>\n          )}\n        </div>\n      </CardContent>\n    </Card>\n  );\n}',
      file_finished: true,
    },
    {
      file_name: 'LoadingSkeleton.tsx',
      file_path: 'app/components/LoadingSkeleton.tsx',
      file_content:
        'import { Skeleton } from \'@/components/ui/skeleton\';\n\nexport function LoadingSkeleton() {\n  return (\n    <div className="w-full space-y-4">\n      {[1, 2, 3].map((i) => (\n        <div key={i} className="w-full space-y-4">\n          <Skeleton className="h-8 w-3/4" />\n          <Skeleton className="h-4 w-1/2" />\n          <Skeleton className="h-32 w-full" />\n        </div>\n      ))}\n    </div>\n  );\n}',
      file_finished: true,
    },
    {
      file_name: 'page.tsx',
      file_path: 'app/page.tsx',
      file_content:
        'import { Suspense } from \'reacttt\';\nimport { getFeeds } from \'../lib/feedsService\';\nimport { FeedCard } from \'../components/FeedCard\';\nimport { LoadingSkeleton } from \'../components/LoadingSkeleton\';\n\nasync function FeedsList() {\n  try {\n    const { feeds } = await getFeeds();\n\n    if (!feeds.length) {\n      return (\n        <div className="text-center py-10">\n          <p className="text-xl text-muted-foreground">No feeds available</p>\n        </div>\n      );\n    }\n\n    return (\n      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n        {feeds.map((feed) => (\n          <FeedCard key={feed.id} feed={feed} />\n        ))}\n      </div>\n    );\n  } catch (error) {\n    console.error(\'Error in FeedsList:\', error);\n    return (\n      <div className="text-center py-10">\n        <p className="text-xl text-red-500">Error loading feeds</p>\n        <button\n          onClick={() => window.location.reload()}\n          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"\n        >\n          Retry\n        </button>\n      </div>\n    );\n  }\n}\n\nexport default function FeedsPage() {\n  return (\n    <div className="container mx-auto px-4 py-8">\n      <h1 className="text-3xl font-bold mb-8">Feeds</h1>\n      <Suspense fallback={<LoadingSkeleton />}>\n        <FeedsList />\n      </Suspense>\n    </div>\n  );\n}',
      file_finished: true,
    },
  ],
}

export const codeArtifactWithRuntimeError = {
  commentary:
    "I'll help you create a comprehensive feeds page that fetches and displays data from Firestore. Here's what we'll implement:\n\n1. First, we'll set up the necessary types and Firestore configuration\n2. Create a feeds page component with server-side data fetching\n3. Add a FeedCard component for displaying individual feeds\n4. Implement loading and error states\n5. Add responsive styling using Tailwind CSS\n6. Include pagination functionality\n\nLet's break this down into multiple files for better organization.",
  title: 'Feeds Page',
  description:
    'Create a feeds page with Firestore integration and responsive design.',
  additional_dependencies: [],
  has_additional_dependencies: false,
  install_dependencies_command: '',
  code: [
    {
      file_name: 'page.tsx',
      file_path: 'app/page.tsx',
      file_content:
        "import React from 'react';\n\nexport default function Page() {\n  // Intentionally throw an error at runtime\n  throw new Error('Intentional runtime error in Page component');\n  return (<div>Should not render</div>);\n}\n",
      file_finished: true,
    },
  ],
}

// simple code artifact for feeds page with shadcn components usage but no actual firestore usage
export const codeArtifactWithShadcn = {
  commentary:
    "I'll help you create a comprehensive feeds page that fetches and displays data from Firestore. Here's what we'll implement:\n\n1. First, we'll set up the necessary types and Firestore configuration\n2. Create a feeds page component with server-side data fetching\n3. Add a FeedCard component for displaying individual feeds\n4. Implement loading and error states\n5. Add responsive styling using Tailwind CSS\n6. Include pagination functionality\n\nLet's break this down into multiple files for better organization.",
  title: 'Feeds Page',
  description:
    'Create a feeds page with Firestore integration and responsive design.',
  additional_dependencies: [],
  has_additional_dependencies: false,
  install_dependencies_command: '',
  code: [
    {
      file_name: 'types.ts',
      file_path: 'app/types/feeds.ts',
      file_content:
        'export interface Feed {\n  id: string;\n  title: string;\n  description: string;\n  imageUrl?: string;\n  author: string;\n  createdAt: Date;\n  category?: string;\n  likes?: number;\n}\n\nexport interface FeedResponse {\n  feeds: Feed[];\n  lastVisible?: any;\n  hasMore: boolean;\n}',
      file_finished: true,
    },
    {
      file_name: 'firebase.ts',
      file_path: 'app/lib/firebase.ts',
      file_content:
        "import { initializeApp, getApps, getApp } from 'firebase/app';\nimport { getFirestore } from 'firebase/firestore';\n\nconst firebaseConfig = {\n  // Replace with your Firebase config\n  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,\n  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,\n  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,\n  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,\n  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,\n  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID\n};\n\nconst app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);\nconst db = getFirestore(app);\n\nexport { db };",
      file_finished: true,
    },
    {
      file_name: 'feedsService.ts',
      file_path: 'app/lib/feedsService.ts',
      file_content:
        "import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';\nimport { db } from './firebase';\nimport { Feed, FeedResponse } from '../types/feeds';\n\nconst FEEDS_PER_PAGE = 10;\n\nexport async function getFeeds(page = 1, lastVisible?: any): Promise<FeedResponse> {\n  try {\n    const feedsRef = collection(db, 'feeds');\n    let feedQuery = query(\n      feedsRef,\n      orderBy('createdAt', 'desc'),\n      limit(FEEDS_PER_PAGE)\n    );\n\n    if (lastVisible) {\n      feedQuery = query(feedQuery, startAfter(lastVisible));\n    }\n\n    const snapshot = await getDocs(feedQuery);\n    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];\n    \n    const feeds = snapshot.docs.map(doc => ({\n      id: doc.id,\n      ...doc.data(),\n      createdAt: doc.data().createdAt?.toDate()\n    })) as Feed[];\n\n    return {\n      feeds,\n      lastVisible: lastVisibleDoc,\n      hasMore: feeds.length === FEEDS_PER_PAGE\n    };\n  } catch (error) {\n    console.error('Error fetching feeds:', error);\n    throw error;\n  }\n}",
      file_finished: true,
    },
    {
      file_name: 'FeedCard.tsx',
      file_path: 'app/components/FeedCard.tsx',
      file_content:
        'import { Card, CardHeader, CardTitle, CardDescription, CardContent } from \'@/components/ui/card\';\nimport { Feed } from \'../types/feeds\';\n\ninterface FeedCardProps {\n  feed: Feed;\n}\n\nexport function FeedCard({ feed }: FeedCardProps) {\n  return (\n    <Card className="w-full hover:shadow-lg transition-shadow duration-200">\n      <CardHeader>\n        <CardTitle className="text-xl">{feed.title}</CardTitle>\n        <p className="text-sm text-muted-foreground">\n          By {feed.author} · {feed.createdAt.toLocaleDateString()}\n        </p>\n      </CardHeader>\n      <CardContent>\n        <CardDescription className="line-clamp-3">\n          {feed.description}\n        </CardDescription>\n        {feed.imageUrl && (\n          <div className="mt-4">\n            <img\n              src={feed.imageUrl}\n              alt={feed.title}\n              className="w-full h-48 object-cover rounded-md"\n            />\n          </div>\n        )}\n        <div className="mt-4 flex items-center gap-2">\n          {feed.category && (\n            <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">\n              {feed.category}\n            </span>\n          )}\n          {feed.likes !== undefined && (\n            <span className="text-sm text-muted-foreground">\n              {feed.likes} likes\n            </span>\n          )}\n        </div>\n      </CardContent>\n    </Card>\n  );\n}',
      file_finished: true,
    },
    {
      file_name: 'LoadingSkeleton.tsx',
      file_path: 'app/components/LoadingSkeleton.tsx',
      file_content:
        'import { Skeleton } from \'@/components/ui/skeleton\';\n\nexport function LoadingSkeleton() {\n  return (\n    <div className="w-full space-y-4">\n      {[1, 2, 3].map((i) => (\n        <div key={i} className="w-full space-y-4">\n          <Skeleton className="h-8 w-3/4" />\n          <Skeleton className="h-4 w-1/2" />\n          <Skeleton className="h-32 w-full" />\n        </div>\n      ))}\n    </div>\n  );\n}',
      file_finished: true,
    },
    {
      file_name: 'page.tsx',
      file_path: 'app/feeds/page.tsx',
      file_content:
        'import { Suspense } from \'react\';\nimport { getFeeds } from \'../lib/feedsService\';\nimport { FeedCard } from \'../components/FeedCard\';\nimport { LoadingSkeleton } from \'../components/LoadingSkeleton\';\n\nasync function FeedsList() {\n  try {\n    const { feeds } = await getFeeds();\n\n    if (!feeds.length) {\n      return (\n        <div className="text-center py-10">\n          <p className="text-xl text-muted-foreground">No feeds available</p>\n        </div>\n      );\n    }\n\n    return (\n      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n        {feeds.map((feed) => (\n          <FeedCard key={feed.id} feed={feed} />\n        ))}\n      </div>\n    );\n  } catch (error) {\n    console.error(\'Error in FeedsList:\', error);\n    return (\n      <div className="text-center py-10">\n        <p className="text-xl text-red-500">Error loading feeds</p>\n        <button\n          onClick={() => window.location.reload()}\n          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"\n        >\n          Retry\n        </button>\n      </div>\n    );\n  }\n}\n\nexport default function FeedsPage() {\n  return (\n    <div className="container mx-auto px-4 py-8">\n      <h1 className="text-3xl font-bold mb-8">Feeds</h1>\n      <Suspense fallback={<LoadingSkeleton />}>\n        <FeedsList />\n      </Suspense>\n    </div>\n  );\n}',
      file_finished: true,
    },
  ],
  page: '/feeds',
}

export const codeArtifactSimpleApp = {
  commentary:
    "I'll help you create a minimal Next.js application with a homepage. Here's what we'll implement:\n\n" +
    '1. Set up the root layout and global styles\n' +
    '2. Create a simple home page component with a welcome message and button\n\n' +
    "Let's break this down into the necessary files.",
  title: 'Home Page',
  description:
    'Create a simple Next.js application with a homepage displaying a welcome message and a button.',
  additional_dependencies: [],
  has_additional_dependencies: false,
  install_dependencies_command: '',
  code: [
    {
      file_name: 'layout.tsx',
      file_path: 'app/layout.tsx',
      file_content:
        "import './globals.css'\n\n" +
        'export const metadata = {\n' +
        "  title: 'Simple Next.js App',\n" +
        "  description: 'A minimal Next.js application',\n" +
        '}\n\n' +
        'export default function RootLayout({ children }: { children: React.ReactNode }) {\n' +
        '  return (\n' +
        '    <html lang="en">\n' +
        '      <body>\n' +
        '        {children}\n' +
        '      </body>\n' +
        '    </html>\n' +
        '  )\n' +
        '}',
      file_finished: true,
    },
    {
      file_name: 'globals.css',
      file_path: 'app/globals.css',
      file_content:
        'html, body {\n' +
        '  margin: 0;\n' +
        '  padding: 0;\n' +
        "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen;\n" +
        '  background-color: #f9fafb;\n' +
        '  color: #111827;\n' +
        '}\n\n' +
        'a {\n' +
        '  color: #1d4ed8;\n' +
        '  text-decoration: none;\n' +
        '}\n\n' +
        'button {\n' +
        '  cursor: pointer;\n' +
        '}',
      file_finished: true,
    },
    {
      file_name: 'page.tsx',
      file_path: 'app/page.tsx',
      file_content:
        'export default function HomePage() {\n' +
        '  return (\n' +
        '    <main style={{\n' +
        "      minHeight: '100vh',\n" +
        "      display: 'flex',\n" +
        "      flexDirection: 'column',\n" +
        "      alignItems: 'center',\n" +
        "      justifyContent: 'center',\n" +
        "      padding: '2rem'\n" +
        '    }}>\n' +
        "      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>\n" +
        '        Welcome to Next.js!\n' +
        '      </h1>\n' +
        "      <p style={{ marginBottom: '2rem', color: '#6b7280' }}>\n" +
        '        This is your homepage.\n' +
        '      </p>\n' +
        '      <button style={{\n' +
        "        padding: '0.75rem 1.5rem',\n" +
        "        backgroundColor: '#3b82f6',\n" +
        "        color: '#ffffff',\n" +
        "        border: 'none',\n" +
        "        borderRadius: '0.375rem',\n" +
        "        fontSize: '1rem'\n" +
        '      }}>\n' +
        '        Get Started\n' +
        '      </button>\n' +
        '    </main>\n' +
        '  )\n' +
        '}',
      file_finished: true,
    },
  ],
  page: '/',
}
