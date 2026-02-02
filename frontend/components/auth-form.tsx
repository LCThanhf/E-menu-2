"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, UtensilsCrossed, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAdmin, registerAdmin, verifyAdminEmail, resetAdminPassword } from "@/lib/api"

type AuthMode = "login" | "signup" | "forgot-password"

export function AuthForm() {
  const router = useRouter()
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  
  // For forgot password flow
  const [forgotPasswordStep, setForgotPasswordStep] = useState<1 | 2>(1) // 1 = enter email, 2 = set new password
  const [verifiedEmail, setVerifiedEmail] = useState("")
  const [verifiedFullName, setVerifiedFullName] = useState("")
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    newPassword: "",
    confirmNewPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    
    // Validate password confirmation for sign up
    if (authMode === "signup" && formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    setIsLoading(true)

    try {
      let result
      
      if (authMode === "signup") {
        // Register
        result = await registerAdmin({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        })
      } else {
        // Login
        result = await loginAdmin({
          email: formData.email,
          password: formData.password,
        })
      }

      if (result.success && result.data) {
        // Save token to localStorage
        localStorage.setItem("adminToken", result.data.token)
        localStorage.setItem("adminUser", JSON.stringify(result.data.user))
        
        // Redirect to admin dashboard
        router.push("/admin/dashboard")
      } else {
        setError(result.message || "Có lỗi xảy ra, vui lòng thử lại")
      }
    } catch (err) {
      console.error("Auth error:", err)
      setError("Không thể kết nối đến server")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await verifyAdminEmail(formData.email)
      
      if (result.success && result.data) {
        setVerifiedEmail(result.data.email)
        setVerifiedFullName(result.data.fullName)
        setForgotPasswordStep(2)
      } else {
        setError(result.message || "Email không tồn tại trong hệ thống")
      }
    } catch (err) {
      console.error("Verify email error:", err)
      setError("Không thể kết nối đến server")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.newPassword !== formData.confirmNewPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    if (formData.newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }

    setIsLoading(true)

    try {
      const result = await resetAdminPassword(verifiedEmail, formData.newPassword)
      
      if (result.success) {
        setSuccessMessage("Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...")
        setTimeout(() => {
          setAuthMode("login")
          setForgotPasswordStep(1)
          setVerifiedEmail("")
          setVerifiedFullName("")
          setFormData({
            email: "",
            password: "",
            confirmPassword: "",
            fullName: "",
            newPassword: "",
            confirmNewPassword: "",
          })
          setSuccessMessage("")
        }, 2000)
      } else {
        setError(result.message || "Có lỗi xảy ra, vui lòng thử lại")
      }
    } catch (err) {
      console.error("Reset password error:", err)
      setError("Không thể kết nối đến server")
    } finally {
      setIsLoading(false)
    }
  }

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode)
    setError("")
    setSuccessMessage("")
    setForgotPasswordStep(1)
    setVerifiedEmail("")
    setVerifiedFullName("")
  }

  // Render Forgot Password Form
  const renderForgotPasswordForm = () => (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          {forgotPasswordStep === 1 ? "Quên mật khẩu" : "Đặt mật khẩu mới"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {forgotPasswordStep === 1 
            ? "Nhập email để xác minh tài khoản của bạn"
            : `Xin chào ${verifiedFullName}, hãy đặt mật khẩu mới`}
        </p>
      </div>

      {forgotPasswordStep === 1 ? (
        /* Step 1: Enter Email */
        <form onSubmit={handleVerifyEmail} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="forgot-email" className="text-foreground">
              Email
            </Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="h-11 bg-background"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <Button type="submit" className="h-11 w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xác minh...
              </>
            ) : (
              "Xác minh email"
            )}
          </Button>
        </form>
      ) : (
        /* Step 2: Set New Password */
        <form onSubmit={handleResetPassword} className="space-y-5">
          {/* Verified email display */}
          <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-600 dark:text-green-400">
                Email đã xác minh: {verifiedEmail}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-foreground">
              Mật khẩu mới
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu mới"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                className="h-11 bg-background pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-new-password" className="text-foreground">
              Xác nhận mật khẩu mới
            </Label>
            <Input
              id="confirm-new-password"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={formData.confirmNewPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmNewPassword: e.target.value })
              }
              className="h-11 bg-background"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
              {successMessage}
            </div>
          )}

          <Button type="submit" className="h-11 w-full" disabled={isLoading || !!successMessage}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Đặt lại mật khẩu"
            )}
          </Button>
        </form>
      )}

      {/* Back to Login */}
      <div className="mt-6 text-center text-sm">
        <button
          type="button"
          onClick={() => switchAuthMode("login")}
          className="font-medium text-primary hover:underline"
        >
          ← Quay lại đăng nhập
        </button>
      </div>
    </div>
  )

  // Render Login/Signup Form
  const renderAuthForm = () => (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          {authMode === "signup" ? "Tạo tài khoản" : "Đăng nhập"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {authMode === "signup"
            ? "Đăng ký tài khoản nhân viên mới"
            : "Đăng nhập vào hệ thống quản lý"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {authMode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-foreground">
              Họ và tên
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="h-11 bg-background"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="h-11 bg-background"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">
            Mật khẩu
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="h-11 bg-background pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {authMode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">
              Xác nhận mật khẩu
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                })
              }
              className="h-11 bg-background"
              required
            />
          </div>
        )}

        {authMode === "login" && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => switchAuthMode("forgot-password")}
              className="text-sm text-primary hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" className="h-11 w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xử lý...
            </>
          ) : authMode === "signup" ? (
            "Đăng ký"
          ) : (
            "Đăng nhập"
          )}
        </Button>
      </form>

      {/* Toggle Auth Mode */}
      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">
          {authMode === "signup" ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
        </span>
        <button
          type="button"
          onClick={() => switchAuthMode(authMode === "signup" ? "login" : "signup")}
          className="font-medium text-primary hover:underline"
        >
          {authMode === "signup" ? "Đăng nhập" : "Đăng ký ngay"}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Quay lại</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">E-Menu</span>
          </div>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {authMode === "forgot-password" ? renderForgotPasswordForm() : renderAuthForm()}
        </div>
      </div>
    </div>
  )
}
