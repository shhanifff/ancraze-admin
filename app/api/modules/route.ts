import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

let adminDb: any = null;
let adminStorage: any = null;

const initializeFirebaseAdmin = () => {
  if (adminDb && adminStorage) return;

  if (
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_PRIVATE_KEY !== 'your_private_key_here'
  ) {
    try {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');

      const serviceAccount = {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      };

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      }

      adminDb = admin.firestore();
      adminStorage = admin.storage();
    } catch (error) {
      console.error('❌ Firebase Admin initialization error:', error);
      throw new Error('Firebase Admin not initialized');
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    initializeFirebaseAdmin();

    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    console.log('📨 Modules POST request received');
    const contentType = request.headers.get('content-type') || '';
    console.log('📨 Content-Type:', contentType);

    let courseId = '';
    let moduleTitle = '';
    let videoUrl = '';
    let questions: any[] = [];

    try {
      console.log('🔄 Parsing request body...');
      const body = await request.json();
      
      courseId = body.courseId || '';
      moduleTitle = body.moduleTitle || '';
      videoUrl = body.videoUrl || '';
      questions = body.questions || [];
      
      console.log('✅ Request parsed successfully');
      console.log('  - courseId:', courseId);
      console.log('  - moduleTitle:', moduleTitle);
      console.log('  - videoUrl:', videoUrl ? '✓' : '(empty)');
      console.log('  - questions count:', questions.length);
    } catch (parseError) {
      console.error('❌ Failed to parse request:', parseError);
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!courseId || !moduleTitle) {
      console.error('❌ Validation failed - Missing courseId or moduleTitle');
      console.error('  - courseId:', courseId || 'MISSING');
      console.error('  - moduleTitle:', moduleTitle || 'MISSING');
      return NextResponse.json(
        { error: 'Missing required fields: courseId and moduleTitle are required' },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed, creating module...');

    // Create module data
    const moduleData = {
      courseId,
      title: moduleTitle,
      videoUrl: videoUrl || 'no video url',
      questions: questions || [],
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    // Add module to Firestore in nested collection
    const docRef = await adminDb
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .add(moduleData);

    console.log('✅ Module created successfully with ID:', docRef.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Module created successfully',
        moduleId: docRef.id,
        module: moduleData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating module:', error);
    return NextResponse.json(
      {
        error: 'Failed to create module',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    initializeFirebaseAdmin();

    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing courseId parameter' },
        { status: 400 }
      );
    }

    // Fetch modules from nested collection
    const snapshot = await adminDb
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .orderBy('createdAt', 'asc')
      .get();

    const modules = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        modules,
        total: modules.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching modules:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch modules',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeFirebaseAdmin();

    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    const moduleId = searchParams.get('moduleId');

    if (!courseId || !moduleId) {
      return NextResponse.json(
        { error: 'Missing courseId or moduleId' },
        { status: 400 }
      );
    }

    await adminDb
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .doc(moduleId)
      .delete();

    return NextResponse.json(
      { success: true, message: 'Module deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting module:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete module',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
