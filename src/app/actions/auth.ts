'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create server-side Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function signUpUser(formData: {
  firstName: string
  lastName: string
  email: string
  password: string
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Step 1: Create user with Supabase Auth (immediate creation, no email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true, // Auto-confirm, no email verification
      user_metadata: {
        first_name: formData.firstName,
        last_name: formData.lastName
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user account' }
    }

    // Step 2: Create investor row
    const { error: insertError } = await supabase
      .from('investors')
      .insert({
        id: authData.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email
      })

    if (insertError) {
      console.error('Investor creation failed:', insertError)
      return { 
        success: false, 
        error: 'Account created but profile setup failed. Please contact support.' 
      }
    }

    return { success: true, userId: authData.user.id }

  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
} 