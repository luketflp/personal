'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth/actions'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      disabled={isPending}
      onClick={() => startTransition(() => logout())}
    >
      <LogOut className="size-4" /> Sair
    </Button>
  )
}
