import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        {
          error: 'Login service temporarily unavailable. Please configure Firebase Admin SDK.',
          code: 'ADMIN_SDK_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Authenticate using Firebase REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Firebase API key not configured' },
        { status: 500 }
      );
    }

    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      console.error('Firebase REST API error:', authData);
      
      if (authData.error?.message === 'INVALID_EMAIL') {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
      if (authData.error?.message === 'EMAIL_NOT_FOUND') {
        return NextResponse.json(
          { error: 'User not found. Please register first.' },
          { status: 404 }
        );
      }
      if (authData.error?.message === 'INVALID_PASSWORD') {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      if (authData.error?.message === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          { status: 429 }
        );
      }

      throw new Error(authData.error?.message || 'Authentication failed');
    }

    const uid = authData.localId;
    const idToken = authData.idToken;

    // Get user data from Firestore using Admin SDK
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Check if user role is "admin" (allow access)
    const userRole = userData.role || 'admin';
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          uid,
          email: authData.email,
          fullName: userData.fullName || '',
          photoURL: userData.photoURL || null,
          role: userRole,
          authProvider: userData.authProvider || 'email',
        },
        idToken,
      },
      { status: 200 }
    );

    // Set authentication cookies
    response.cookies.set('authToken', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    response.cookies.set('role', userRole, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    response.cookies.set('uid', uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);

    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
