import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    if (!adminDb || !adminStorage) {
      throw new Error('Firebase Admin services not available');
    }

    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const teacherName = formData.get('teacherName') as string;
    const price = parseFloat(formData.get('price') as string);
    const coverImage = formData.get('coverImage') as File;

    // Validate required fields
    if (!title || !description || !teacherName || !price || !coverImage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let imageUrl = '';

    // Upload image to Firebase Storage
    try {
      const bucket = (adminStorage as any).bucket();
      const fileName = `courses/${Date.now()}_${coverImage.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const file = bucket.file(fileName);

      const buffer = await coverImage.arrayBuffer();
      await file.save(Buffer.from(buffer), {
        metadata: {
          contentType: coverImage.type,
        },
      });

      // Make file public and get download URL
      await file.makePublic();
      imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      console.log('✅ Image uploaded successfully:', imageUrl);
    } catch (storageError) {
      console.error('❌ Storage upload error:', storageError);
      // Continue without image URL if upload fails
    }

    // Add course to Firestore using Admin SDK
    const courseData = {
      title,
      description,
      teacherName,
      price: parseFloat(price.toString()),
      coverImage: imageUrl,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await (adminDb as any).collection('courses').add(courseData);

    console.log('✅ Course created successfully with ID:', docRef.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Course created successfully',
        courseId: docRef.id,
        course: courseData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating course:', error);
    return NextResponse.json(
      {
        error: 'Failed to create course',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      throw new Error('Firebase Admin services not available');
    }

    // Check for single course fetch
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    const email = searchParams.get('email');
    const loginId = searchParams.get('loginId');
    const deviceId = searchParams.get('deviceId');

    // Security Check: If email is provided, verify credentials and device
    if (email) {
      if (!loginId || !deviceId) {
        return NextResponse.json(
          { error: 'Login ID and Device ID are required when email is provided' },
          { status: 400 }
        );
      }

      // Verify student credentials and deviceId in Firestore
      const userSnapshot = await (adminDb as any)
        .collection('users')
        .where('email', '==', email)
        .where('loginId', '==', loginId)
        .limit(1)
        .get();

      if (userSnapshot.empty) {
        return NextResponse.json(
          { error: 'Invalid email or Login ID' },
          { status: 401 }
        );
      }

      const userData = userSnapshot.docs[0].data();

      // Device Verification
      if (userData.deviceId && userData.deviceId !== deviceId) {
        return NextResponse.json(
          { error: 'Access denied: Your already login in another device' },
          { status: 403 }
        );
      }
    }

    if (courseId) {
      const doc = await (adminDb as any).collection('courses').doc(courseId).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      // Fetch modules for this specific course
      const modulesSnapshot = await (adminDb as any)
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .orderBy('createdAt', 'asc')
        .get();

      const modules = (modulesSnapshot as any).docs.map((mDoc: any) => ({
        id: mDoc.id,
        ...mDoc.data(),
        createdAt: mDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));

      return NextResponse.json({
        success: true,
        course: {
          id: doc.id,
          ...doc.data(),
          modules,
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }
      }, { status: 200 });
    }

    // Fetch all courses from Firestore
    const snapshot = await (adminDb as any).collection('courses').orderBy('createdAt', 'desc').get();

    const courses = await Promise.all((snapshot as any).docs.map(async (doc: any) => {
      // Fetch module count for each course from its subcollection
      const modulesSnapshot = await (adminDb as any)
        .collection('courses')
        .doc(doc.id)
        .collection('modules')
        .count()
        .get();

      const moduleCount = modulesSnapshot.data().count;

      // Fetch enrolled students count
      const studentsSnapshot = await (adminDb as any)
        .collection('users')
        .where('role', '==', 'student')
        .where('enrolledCourses', 'array-contains', doc.id)
        .count()
        .get();

      const studentCount = studentsSnapshot.data().count;

      return {
        id: doc.id,
        ...doc.data(),
        moduleCount,
        studentCount, // Return the real student count
        // Convert Firestore timestamps to ISO strings
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }));

    return NextResponse.json(
      {
        success: true,
        courses,
        total: courses.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch courses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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

    console.log(`🗑️ Deleting course: ${courseId}`);

    // Delete the course document
    await (adminDb as any).collection('courses').doc(courseId).delete();

    console.log('✅ Course deleted successfully');

    return NextResponse.json(
      { success: true, message: 'Course deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting course:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete course',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
