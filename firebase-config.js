/**
 * PVM Dental Hospital - Firebase Configuration & Reviews Service
 * Connects patient review submissions to Cloud Firestore and provides
 * real-time sync for the website slider and the Doctor Admin Portal.
 */

// 1. Firebase Project Credentials
// Replace the values below with your Firebase Project Configuration from:
// Firebase Console (console.firebase.google.com) -> Project Settings -> General -> Your apps -> Web app
const firebaseConfig = {
  apiKey: "AIzaSyDyu6cciyy8rlQNj-YKpOYNolNxEjWafGw",
  authDomain: "pvm-dental.firebaseapp.com",
  projectId: "pvm-dental",
  storageBucket: "pvm-dental.firebasestorage.app",
  messagingSenderId: "61146238851",
  appId: "1:61146238851:web:f884571e7189777807f0b6"
};

// Check if credentials are still placeholder
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_API_KEY");
};

// Initialize Firebase if configured & SDK is present
let db = null;
if (typeof firebase !== 'undefined' && isFirebaseConfigured()) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
  } catch (err) {
    console.warn("Firebase initialization error:", err);
  }
}

// LocalStorage fallback (allows full testing before Firebase credentials are added)
const LOCAL_STORAGE_KEY = 'pvm_patient_reviews_local';
const localSubscribersApproved = new Set();
const localSubscribersAll = new Set();

const getLocalReviews = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const notifyLocalSubscribers = () => {
  const all = getLocalReviews();
  const approved = all.filter(r => r.isApproved);
  localSubscribersAll.forEach(cb => {
    try { cb(all); } catch(err) { console.error(err); }
  });
  localSubscribersApproved.forEach(cb => {
    try { cb(approved); } catch(err) { console.error(err); }
  });
};

const saveLocalReviews = (reviews) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reviews));
  notifyLocalSubscribers();
};

// Sync across multiple browser tabs in local mode
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === LOCAL_STORAGE_KEY) {
      notifyLocalSubscribers();
    }
  });
}

/**
 * PVM Reviews Database Service
 */
window.PVMReviewsDB = {
  isConfigured: isFirebaseConfigured,

  /**
   * Submit a new patient review
   * Directly approved (isApproved: true) to reflect immediately on the website without verification
   */
  async submitReview({ name, treatment, rating, comment, location }) {
    const reviewData = {
      name: name.trim(),
      treatment: treatment.trim() || 'General Dental Care',
      rating: Number(rating) || 5,
      comment: comment.trim(),
      location: location ? location.trim() : 'Madurai',
      isApproved: true,
      createdAt: new Date().toISOString(),
      source: 'website'
    };

    if (db) {
      // Save directly to Cloud Firestore 'reviews' collection
      const docRef = await db.collection('reviews').add({
        ...reviewData,
        serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...reviewData };
    } else {
      console.info("Using local preview storage (add your Firebase credentials to firebase-config.js to sync live across devices).");
      const localReviews = getLocalReviews();
      const newReview = { id: 'local_' + Date.now(), ...reviewData };
      localReviews.unshift(newReview);
      saveLocalReviews(localReviews);
      return newReview;
    }
  },

  /**
   * Listen to or fetch all APPROVED reviews for public display on the website
   */
  subscribeApprovedReviews(callback) {
    if (db) {
      return db.collection('reviews')
        .where('isApproved', '==', true)
        .onSnapshot(
          (snapshot) => {
            const reviews = [];
            snapshot.forEach((doc) => {
              reviews.push({ id: doc.id, ...doc.data() });
            });
            // Sort by createdAt descending
            reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            callback(reviews);
          },
          (err) => {
            console.error("Error fetching approved reviews:", err);
            callback(getLocalReviews().filter(r => r.isApproved));
          }
        );
    } else {
      localSubscribersApproved.add(callback);
      callback(getLocalReviews().filter(r => r.isApproved));
      return () => localSubscribersApproved.delete(callback);
    }
  },

  /**
   * Listen to ALL reviews (pending & approved) for the Doctor Admin Portal
   */
  subscribeAllReviews(callback) {
    if (db) {
      return db.collection('reviews')
        .onSnapshot(
          (snapshot) => {
            const reviews = [];
            snapshot.forEach((doc) => {
              reviews.push({ id: doc.id, ...doc.data() });
            });
            reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            callback(reviews);
          },
          (err) => {
            console.error("Error fetching admin reviews:", err);
            callback(getLocalReviews());
          }
        );
    } else {
      localSubscribersAll.add(callback);
      callback(getLocalReviews());
      return () => localSubscribersAll.delete(callback);
    }
  },

  /**
   * Approve a review so it shows up live on the website
   */
  async approveReview(reviewId) {
    if (db && !reviewId.startsWith('local_')) {
      await db.collection('reviews').doc(reviewId).update({
        isApproved: true,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      const localReviews = getLocalReviews();
      const updated = localReviews.map(r => r.id === reviewId ? { ...r, isApproved: true } : r);
      saveLocalReviews(updated);
    }
  },

  /**
   * Unpublish/Reject back to pending
   */
  async unpublishReview(reviewId) {
    if (db && !reviewId.startsWith('local_')) {
      await db.collection('reviews').doc(reviewId).update({
        isApproved: false
      });
    } else {
      const localReviews = getLocalReviews();
      const updated = localReviews.map(r => r.id === reviewId ? { ...r, isApproved: false } : r);
      saveLocalReviews(updated);
    }
  },

  /**
   * Permanently delete a review
   */
  async deleteReview(reviewId) {
    if (db && !reviewId.startsWith('local_')) {
      await db.collection('reviews').doc(reviewId).delete();
    } else {
      const localReviews = getLocalReviews().filter(r => r.id !== reviewId);
      saveLocalReviews(localReviews);
    }
  }
};
