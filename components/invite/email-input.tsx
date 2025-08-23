'use client'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { X, AlertCircle } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'

interface EmailInputProps {
  emails: string[]
  onEmailsChange: (emails: string[]) => void
}

export function EmailInput({ emails, onEmailsChange }: EmailInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showValidationError, setShowValidationError] = useState(false)
  const [invalidEmail, setInvalidEmail] = useState('')
  // Email validation regex
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim()
    if (trimmedEmail && !emails.includes(trimmedEmail)) {
      if (isValidEmail(trimmedEmail)) {
        onEmailsChange([...emails, trimmedEmail])
        setShowValidationError(false)
        setInvalidEmail('')
        return true
      } else {
        setShowValidationError(true)
        setInvalidEmail(trimmedEmail)
        return false
      }
    }
    return false
  }

  const removeEmail = (emailToRemove: string) => {
    onEmailsChange(emails.filter((email) => email !== emailToRemove))
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)

    // Hide validation error when user starts typing
    if (showValidationError && value !== invalidEmail) {
      setShowValidationError(false)
      setInvalidEmail('')
    }

    // Check if comma was entered
    if (value.includes(',')) {
      const parts = value.split(',')
      const emailsToAdd = parts
        .slice(0, -1)
        .map((email) => email.trim())
        .filter((email) => email)
      const remaining = parts[parts.length - 1]

      let allValid = true
      emailsToAdd.forEach((email) => {
        const isAdded = addEmail(email)
        if (!isAdded && email.trim()) {
          allValid = false
        }
      })

      if (allValid) {
        setInputValue(remaining)
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (inputValue.trim()) {
        const isAdded = addEmail(inputValue.trim())
        if (isAdded) {
          setInputValue('')
        }
        // If invalid, keep the email in the input field
      }
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      // Remove last email if backspace is pressed and input is empty
      removeEmail(emails[emails.length - 1])
    }
  }

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      const isAdded = addEmail(inputValue.trim())
      if (isAdded) {
        setInputValue('')
      }
      // If invalid, keep the email in the input field
    }
  }

  return (
    <div className="space-y-2">
      <div className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {emails.map((email, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                aria-label={`Remove ${email}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            placeholder={emails.length === 0 ? 'Enter email addresses...' : ''}
            className="flex-1 min-w-[120px] border-0 p-0 shadow-none focus-visible:ring-0"
            aria-describedby={
              showValidationError ? 'email-validation-message' : undefined
            }
          />
        </div>
      </div>

      {showValidationError && (
        <div
          id="email-validation-message"
          className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4" />
          <span>&quot;{invalidEmail}&quot; is not a valid email address</span>
        </div>
      )}
    </div>
  )
}
