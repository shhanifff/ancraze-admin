import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// Helper to generate a random login ID
const generateLoginId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export async function GET(request: NextRequest) {
    try {
        if (!adminDb) {
            throw new Error('Firebase Admin services not available');
        }

        const searchParams = request.nextUrl.searchParams;
        const studentId = searchParams.get('studentId');

        if (studentId) {
            // Fetch single student
            const doc = await (adminDb as any).collection('users').doc(studentId).get();
            if (!doc.exists) {
                return NextResponse.json({ error: 'Student not found' }, { status: 404 });
            }

            const data = doc.data();
            return NextResponse.json({
                success: true,
                student: {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                }
            }, { status: 200 });
        }

        // Fetch all students/staff
        const requestedRole = searchParams.get('role');

        const snapshot = await (adminDb as any)
            .collection('users')
            .get();

        const students = snapshot.docs
            .map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            }))
            .filter((u: any) => {
                if (requestedRole) return u.role === requestedRole;
                return u.role === 'student' || u.role === 'user' || !u.role;
            });

        return NextResponse.json({ success: true, students }, { status: 200 });
    } catch (error) {
        console.error('❌ Error fetching students:', error);
        return NextResponse.json(
            { error: 'Failed to fetch students', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!adminAuth || !adminDb) {
            throw new Error('Firebase Admin services not available');
        }

        const body = await request.json();
        const { email, fullName, enrolledCourses } = body;

        if (!email || !fullName) {
            return NextResponse.json(
                { error: 'Email and Full Name are required' },
                { status: 400 }
            );
        }

        // Check if user already exists in Auth
        try {
            await (adminAuth as any).getUserByEmail(email);
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            );
        } catch (err: any) {
            if (err.code !== 'auth/user-not-found') throw err;
        }

        const loginId = generateLoginId();

        // Create user in Firebase Auth with loginId as password
        const userRecord = await (adminAuth as any).createUser({
            email,
            password: loginId,
            displayName: fullName,
        });

        const studentData = {
            uid: userRecord.uid,
            email,
            fullName,
            loginId, // Store the plain loginId for admin reference
            role: 'student',
            enrolledCourses: enrolledCourses || [],
            createdAt: new Date(),
            authProvider: 'email',
        };

        // Save to Firestore
        await (adminDb as any).collection('users').doc(userRecord.uid).set(studentData);

        return NextResponse.json(
            {
                success: true,
                message: 'Student added successfully',
                student: studentData
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('❌ Error adding student:', error);
        return NextResponse.json(
            {
                error: 'Failed to add student',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        if (!adminAuth || !adminDb) {
            throw new Error('Firebase Admin services not available');
        }

        const body = await request.json();
        const { studentId, fullName, enrolledCourses, resetDeviceId, role } = body;

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (fullName) updateData.fullName = fullName;
        if (enrolledCourses) updateData.enrolledCourses = enrolledCourses;
        if (resetDeviceId) updateData.deviceId = null; // Option to clear deviceId for student
        if (role) updateData.role = role;

        await (adminDb as any).collection('users').doc(studentId).update(updateData);

        return NextResponse.json({
            success: true,
            message: 'Student updated successfully'
        }, { status: 200 });
    } catch (error) {
        console.error('❌ Error updating student:', error);
        return NextResponse.json(
            { error: 'Failed to update student', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        if (!adminAuth || !adminDb) {
            throw new Error('Firebase Admin services not available');
        }

        const searchParams = request.nextUrl.searchParams;
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
        }

        // Delete from Auth
        try {
            await (adminAuth as any).deleteUser(studentId);
        } catch (authErr) {
            console.warn('Student not found in Auth or deletion failed', authErr);
        }

        // Delete from Firestore
        await (adminDb as any).collection('users').doc(studentId).delete();

        return NextResponse.json({
            success: true,
            message: 'Student deleted successfully'
        }, { status: 200 });
    } catch (error) {
        console.error('❌ Error deleting student:', error);
        return NextResponse.json(
            { error: 'Failed to delete student', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
