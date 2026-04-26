// ========== FIREBASE CONFIG ==========
// ⚠️ Replace with your own Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyC4krHHKN_akZKFVBH8gGc_tOXTYdITHrc",
  authDomain: "back-56362.firebaseapp.com",
  databaseURL: "https://back-56362-default-rtdb.firebaseio.com",
  projectId: "back-56362",
  storageBucket: "back-56362.firebasestorage.app",
  messagingSenderId: "408356846316",
  appId: "1:408356846316:web:4a514996715f43b0afc3c9",
  measurementId: "G-VPTFKR0DFD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const IMGBB_API_KEY = "cc72ba01e3b6d759c4de57e14c3952d1";


// Admin email (for demo – change as needed)
const ADMIN_EMAIL = "admin@chirp.com";

// ========== DOM ELEMENTS ==========
const googleSignInBtn = document.getElementById("googleSignInBtn");
const emailSignInBtn = document.getElementById("emailSignInBtn");
const signUpBtn = document.getElementById("signUpBtn");
const userMenu = document.getElementById("userMenu");
const userAvatar = document.getElementById("userAvatar");
const userDropdown = document.getElementById("userDropdown");
const editProfileBtn = document.getElementById("editProfileBtn");
const logoutBtn = document.getElementById("logoutBtn");

const createPostCard = document.getElementById("createPostCard");
const postText = document.getElementById("postText");
const imageUploadInput = document.getElementById("imageUploadInput");
const imagePreview = document.getElementById("imagePreview");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const removeImageBtn = document.getElementById("removeImageBtn");
const submitPostBtn = document.getElementById("submitPostBtn");
const feedGrid = document.getElementById("feedGrid");

const authModal = document.getElementById("authModal");
const authModalTitle = document.getElementById("authModalTitle");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSwitchText = document.getElementById("authSwitchText");
const authSwitchLink = document.getElementById("authSwitchLink");
const authError = document.getElementById("authError");
const closeModal = document.querySelector(".close-modal");

let currentUser = null;
let selectedImageFile = null;
let isSignUpMode = false;

// ========== AUTH STATE LISTENER ==========
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        // Show user menu, hide auth buttons
        googleSignInBtn.style.display = "none";
        emailSignInBtn.style.display = "none";
        signUpBtn.style.display = "none";
        userMenu.style.display = "block";
        userAvatar.src = user.photoURL || "https://via.placeholder.com/36";
        createPostCard.classList.add("visible");
    } else {
        googleSignInBtn.style.display = "inline-block";
        emailSignInBtn.style.display = "inline-block";
        signUpBtn.style.display = "inline-block";
        userMenu.style.display = "none";
        createPostCard.classList.remove("visible");
    }
    loadPosts();
});

// ========== MODAL HANDLING ==========
emailSignInBtn.addEventListener("click", () => openAuthModal(false));
signUpBtn.addEventListener("click", () => openAuthModal(true));
authSwitchLink.addEventListener("click", (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    updateAuthModal();
});
closeModal.addEventListener("click", () => authModal.classList.remove("active"));

function openAuthModal(signUp) {
    isSignUpMode = signUp;
    updateAuthModal();
    authModal.classList.add("active");
}

function updateAuthModal() {
    if (isSignUpMode) {
        authModalTitle.textContent = "Create Account";
        authSwitchText.innerHTML = 'Already have an account? <a href="#" id="authSwitchLink">Sign In</a>';
        document.getElementById("authSwitchLink").addEventListener("click", (e) => {
            e.preventDefault();
            isSignUpMode = false;
            updateAuthModal();
        });
        authForm.querySelector("button").textContent = "Sign Up";
    } else {
        authModalTitle.textContent = "Sign In";
        authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" id="authSwitchLink">Sign Up</a>';
        document.getElementById("authSwitchLink").addEventListener("click", (e) => {
            e.preventDefault();
            isSignUpMode = true;
            updateAuthModal();
        });
        authForm.querySelector("button").textContent = "Sign In";
    }
    authError.textContent = "";
    authEmail.value = "";
    authPassword.value = "";
}

authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (isSignUpMode) {
        auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            authModal.classList.remove("active");
            // Set default display name from email
            const user = auth.currentUser;
            if (user) {
                user.updateProfile({ displayName: email.split('@')[0] });
            }
        })
        .catch(error => authError.textContent = error.message);
    } else {
        auth.signInWithEmailAndPassword(email, password)
        .then(() => authModal.classList.remove("active"))
        .catch(error => authError.textContent = error.message);
    }
});

// Google Sign-In
googleSignInBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => alert(error.message));
});

// ========== USER DROPDOWN ==========
userAvatar.addEventListener("click", () => {
    userDropdown.classList.toggle("active");
});
window.addEventListener("click", (e) => {
    if (!e.target.closest(".user-menu")) {
        userDropdown.classList.remove("active");
    }
});

editProfileBtn.addEventListener("click", () => {
    const newName = prompt("Enter new display name:", currentUser?.displayName || "");
    if (newName && currentUser) {
        currentUser.updateProfile({ displayName: newName }).then(() => {
            alert("Profile name updated!");
            userDropdown.classList.remove("active");
        }).catch(err => alert(err.message));
    }
});

logoutBtn.addEventListener("click", () => {
    auth.signOut();
    userDropdown.classList.remove("active");
});

// ========== IMAGE HANDLING ==========
imageUploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedImageFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
            imagePreview.src = ev.target.result;
            imagePreviewContainer.style.display = "inline-block";
        };
        reader.readAsDataURL(file);
    }
});

removeImageBtn.addEventListener("click", () => {
    selectedImageFile = null;
    imagePreview.src = "";
    imagePreviewContainer.style.display = "none";
    imageUploadInput.value = "";
});

// ========== SUBMIT POST ==========
submitPostBtn.addEventListener("click", async () => {
    if (!currentUser) return alert("You must be logged in to post.");
    const text = postText.value.trim();
    if (!text && !selectedImageFile) return alert("Please write something or add an image.");

    submitPostBtn.disabled = true;
    submitPostBtn.textContent = "Posting...";

    let imageUrl = null;

    if (selectedImageFile) {
        // Upload to ImgBB
        const formData = new FormData();
        formData.append("image", selectedImageFile);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                imageUrl = result.data.url;   // direct image URL
            } else {
                throw new Error(result.error?.message || "ImgBB upload failed");
            }
        } catch (err) {
            alert("Image upload failed: " + err.message);
            submitPostBtn.disabled = false;
            submitPostBtn.textContent = "Chirp";
            return;
        }
    }

    const postData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        userPhoto: currentUser.photoURL || "",
        text: text,
        imageUrl: imageUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: [],
        likeCount: 0
    };

    try {
        await db.collection("posts").add(postData);
        postText.value = "";
        selectedImageFile = null;
        imagePreviewContainer.style.display = "none";
        imageUploadInput.value = "";
    } catch (err) {
        alert("Failed to create post: " + err.message);
    }
    submitPostBtn.disabled = false;
    submitPostBtn.textContent = "Chirp";
});
// ========== LOAD POSTS (REAL-TIME) ==========
function loadPosts() {
    db.collection("posts")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
        feedGrid.innerHTML = "";
        snapshot.forEach(doc => {
            const post = { id: doc.id, ...doc.data() };
            renderPost(post);
        });
    });
}

function renderPost(post) {
    const card = document.createElement("div");
    card.className = "post-card";
    card.setAttribute("data-post-id", post.id);

    const time = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString() : "Just now";
    const isLiked = currentUser && post.likes && post.likes.includes(currentUser.uid);
    const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;
    const canDelete = isAdmin || (currentUser && currentUser.uid === post.userId);

    card.innerHTML = `
        <div class="post-header">
            <img class="post-avatar" src="${post.userPhoto || 'https://via.placeholder.com/40'}" alt="avatar">
            <div class="post-user-info">
                <div class="post-user-name">${escapeHtml(post.userName)}</div>
                <div class="post-time">${time}</div>
            </div>
        </div>
        ${post.text ? `<div class="post-text">${escapeHtml(post.text)}</div>` : ""}
        ${post.imageUrl ? `<img class="post-image" src="${post.imageUrl}" alt="Post image">` : ""}
        <div class="post-actions">
            <button class="like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>${post.likeCount || 0}</span>
            </button>
            ${canDelete ? `<button class="delete-btn" data-post-id="${post.id}">🗑️</button>` : ""}
        </div>
    `;

    // Like button event
    const likeBtn = card.querySelector(".like-btn");
    if (likeBtn) {
        likeBtn.addEventListener("click", () => toggleLike(post.id));
    }

    // Delete button event
    const delBtn = card.querySelector(".delete-btn");
    if (delBtn) {
        delBtn.addEventListener("click", () => deletePost(post.id, post.imageUrl));
    }

    feedGrid.appendChild(card);
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ========== LIKE TOGGLE ==========
async function toggleLike(postId) {
    if (!currentUser) return alert("Please log in to like posts.");
    const postRef = db.collection("posts").doc(postId);
    const doc = await postRef.get();
    if (!doc.exists) return;
    const data = doc.data();
    let likes = data.likes || [];
    let count = data.likeCount || 0;

    if (likes.includes(currentUser.uid)) {
        likes = likes.filter(uid => uid !== currentUser.uid);
        count = Math.max(0, count - 1);
    } else {
        likes.push(currentUser.uid);
        count += 1;
    }
    await postRef.update({ likes, likeCount: count });
}

async function deletePost(postId, imageUrl) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
        await db.collection("posts").doc(postId).delete();
        // No need to delete from ImgBB (free images can stay)
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
}

// Close modal by clicking outside
window.addEventListener("click", (e) => {
    if (e.target === authModal) authModal.classList.remove("active");
});
