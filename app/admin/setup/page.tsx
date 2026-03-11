import { redirect } from 'next/navigation'

export default function SetupPage() {
  // Redirige inmediatamente a settings para evitar 404 y loops
  redirect('/admin/settings')
}
