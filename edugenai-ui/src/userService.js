import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';

const db = getFirestore();
 export const userService = {
     //User Profile Operations
     async getUserProfile(userId) {
         const userDoc = await getDoc(doc(db, 'users', userId));
         return userDoc.exists() ? userDoc.data(): null;
     },

     async updateUserProfile(userId, data) {
         await setDoc(doc(db, 'users', userId), data, {merge: true});
     },

     //Student specific operations
     async getStudentProfile(userId) {
         const studentDoc = await getDoc(doc(db, 'students', userId));
         return studentDoc.exists() ? studentDoc.data() : null;
     },

     async updateStudentProgress(userId, progressData) {
         await setDoc(doc(db, 'students', userId), {
             progress: progressData,
             lastUpdated: new Date()
         }, {merge: true});
     },

     async addMockTestResult(userId, testResult) {
         const studentRef = doc(db, 'students', userId);
         await updateDoc(studentRef, {
             mockTests: arrayUnion({
                 ...testResult,
                 completedAt: new Date(),
                 id: Date.now().toString()
             })
         });
     },

     async getStudentMockTests(userId) {
         const studentDoc = await getDoc(doc(db, 'students', userId));
         return studentDoc.exists() ? studentDoc.data().mockTests || [] : [];
     },

     //Teacher specific operations
     async getTeacherProfile(userId) {
         const teacherDoc = await getDoc(doc(db, 'teachers', userId));
         return teacherDoc.exists() ? teacherDoc.data(): null;
     },

     async createClass(teacherId, classData) {
         const classRef = await addDoc(collection(db, 'classes'), {
             ...classData,
             teacherId: teacherId,
             createdAt: new Date(),
             students: []
         });
         return classRef.id;
     },

     async getTeacherClasses(teacherId) {
         const classesQuery = query(
             collection(db, 'classes'),
             where('teacherId', '==', teacherId)
         );
         const classesSnapshot = await getDocs(classesQuery);
         return classesSnapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
         }));
     },

     // Assignment Operations
     async createAssignment(assignmentData) {
         const assignmentRef = await addDoc(collection(db, 'assignments'), {
             ...assignmentData,
             createdAt: new Date(),
             submissions: []
         });
         return assignmentRef.id;
     },

     async submitAssignment(studentId, assignmentId, submissionData) {
         const submissionRef = await addDoc(collection(db, 'submissions'), {
             ...submissionData,
             studentId: studentId,
             assignmentId: assignmentId,
             submittedAt: new Date(),
             status: 'submitted'
         });

         // Update student's submissions
         const studentRef = doc(db, 'students', studentId);
         await updateDoc(studentRef, {
             submissions: arrayUnion(submissionRef.id)
         });

         return submissionRef.id;
     },

     // Analytics and Reporting
     async getStudentAnalytics(userId) {
         const studentDoc = await getDoc(doc(db, 'students', userId));
         if (!studentDoc.exists()) return null;

         const studentData = studentDoc.data();
         const mockTests = studentData.mockTests || [];

         return {
             totalTests: mockTests.length,
             averageScore: mockTests.length > 0 ?
                 mockTests.reduce((sum, test) => sum + test.score, 0) / mockTests.length : 0,
             lastTestDate: mockTests.length > 0 ?
                 Math.max(...mockTests.map(test => new Date(test.completedAt).getTime())) : null,
             progress: studentData.progress || {}
         };
     }
 };