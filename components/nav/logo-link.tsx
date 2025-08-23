'use client'

import Image from 'next/image'
import Link from 'next/link'

interface LogoLinkProps {
  href: string
}

export function LogoLink({ href }: LogoLinkProps) {
  return (
    <Link href={href} aria-label="Go to dashboard">
      <Image
        src="/logo/toolmind-dark.svg"
        alt="Toolmind Logo"
        width={30}
        height={30}
        priority
        className="rounded-md"
      />
    </Link>
  )
}
