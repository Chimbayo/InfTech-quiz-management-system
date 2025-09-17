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
import { Loader2, UserPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      setSuccess(true)
      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push('/student')
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="card-inftech-mobile w-full max-w-md mx-auto">
        <CardHeader className="padding-responsive">
          <CardTitle className="text-center text-responsive-xl text-green-600">Registration Successful!</CardTitle>
          <CardDescription className="text-center text-responsive-sm">
            Welcome to the Quiz Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="padding-responsive">
          <div className="text-center spacing-responsive">
            <div className="flex items-center justify-center">
              <div className="p-3 sm:p-4 bg-green-100 rounded-full">
                <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </div>
            <p className="text-responsive-sm text-gray-600">
              Your account has been created successfully. You will be redirected to the login page shortly.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-inftech-mobile w-full max-w-md mx-auto">
      <CardHeader className="padding-responsive">
        <CardTitle className="flex items-center justify-center gap-2 text-responsive-xl heading-inftech-primary">
          <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" />
          Student Registration
        </CardTitle>
        <CardDescription className="text-center text-responsive-sm">
          Create your account to start taking quizzes
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
            <Label htmlFor="name" className="label-responsive">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              className="input-responsive"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-responsive-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="label-responsive">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
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
              placeholder="Create a password (min 6 characters)"
              className="input-responsive"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-responsive-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="label-responsive">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              className="input-responsive"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-responsive-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="btn-inftech-mobile btn-inftech-primary" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <span className="text-responsive-sm">{isLoading ? 'Creating Account...' : 'Create Account'}</span>
          </Button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-responsive-xs text-gray-600">
            Already have an account?{' '}
            <Link href="/student" className="text-blue-600 hover:underline font-medium">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="mt-3 sm:mt-4 text-center">
          <Link href="/">
            <Button variant="ghost" className="btn-inftech-responsive text-gray-600">
              <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-responsive-xs">Back to Home</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
