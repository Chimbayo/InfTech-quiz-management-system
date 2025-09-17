'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  role: 'ADMIN' | 'STUDENT'
  redirectTo: string
}

export function LoginForm({ role, redirectTo }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Login failed')
      }

      if (result.user.role !== role) {
        throw new Error(`Access denied. This portal is for ${role.toLowerCase()}s only.`)
      }

      // Force a hard refresh to ensure the session is properly loaded
      window.location.href = redirectTo
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="card-inftech-mobile w-full max-w-md mx-auto">
      <CardHeader className="padding-responsive">
        <CardTitle className="text-responsive-xl heading-inftech-primary text-center">
          {role === 'ADMIN' ? 'Admin Login' : 'Student Login'}
        </CardTitle>
        <CardDescription className="text-responsive-sm text-center">
          {role === 'ADMIN' 
            ? 'Access the admin dashboard to manage quizzes'
            : 'Access your student portal to take quizzes'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="padding-responsive">
        <form onSubmit={handleSubmit(onSubmit)} className="form-responsive">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="label-responsive">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="input-responsive"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-responsive-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="label-responsive">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="input-responsive"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-responsive-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="btn-inftech-mobile btn-inftech-primary" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <span className="text-responsive-sm">{isLoading ? 'Signing in...' : 'Sign In'}</span>
          </Button>
        </form>

        {role === 'ADMIN' && (
          <div className="mt-4 text-center text-responsive-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-2">Demo credentials:</p>
            <p>Email: admin@example.com</p>
            <p>Password: password123</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
