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
const storage = firebase.storage(); // not used, harmless

// ========== CLOUDINARY CONFIG ==========
const CLOUDINARY_CLOUD_NAME = "dvqwcsgh0";          // Your cloud name
const CLOUDINARY_UPLOAD_PRESET = "chirp_post";      // Your unsigned preset

// Admin email (change to your admin email)
const ADMIN_EMAIL = "admin@chirp.com";

// ========== DOM ELEMENTS ==========
const googleSignInBtn = document.getElementById("googleSignInBtn");
const emailSignInBtn = document.getElementById("emailSignInBtn");
const signUpBtn = document.getElementById("signUpBtn");
const userMenu = document.getElementById("userMenu");
const userAvatar = document.getElementById("userAvatar");
const userDropdown = document.getElementById("userDropdown");
const editProfileBtn = document.getElementById("editProfileBtn");
const editProfilePhotoBtn = document.getElementById("editProfilePhotoBtn");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const logoutBtn = document.getElementById("logoutBtn");

const createPostCard = document.getElementById("createPostCard");
const postText = document.getElementById("postText");
const imageUploadInput = document.getElementById("imageUploadInput");
const imagePreview = document.getElementById("imagePreview");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const removeImageBtn = document.getElementById("removeImageBtn");
const submitPostBtn = document.getElementById("submitPostBtn");
const bulkUploadBtn = document.getElementById("bulkUploadBtn");
const bulkUploadInput = document.getElementById("bulkUploadInput");
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

const themeToggle = document.getElementById("themeToggle");
const body = document.body;

let currentUser = null;
let selectedImageFile = null;
let isSignUpMode = false;

// ========== DARK MODE ==========
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
} else if (savedTheme === "light") {
    body.classList.remove("dark-mode");
    themeToggle.textContent = "🌙";
} else {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        body.classList.add("dark-mode");
        themeToggle.textContent = "☀️";
    }
}

themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const isDark = body.classList.contains("dark-mode");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

// ========== AUTH STATE LISTENER ==========
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        googleSignInBtn.style.display = "none";
        emailSignInBtn.style.display = "none";
        signUpBtn.style.display = "none";
        userMenu.style.display = "block";
        userAvatar.src = user.photoURL || "https://via.placeholder.com/36";
        createPostCard.classList.add("visible");

        // Show bulk upload button only for admin
        if (user.email === ADMIN_EMAIL) {
            bulkUploadBtn.style.display = "inline-block";
        } else {
            bulkUploadBtn.style.display = "none";
        }
    } else {
        googleSignInBtn.style.display = "inline-block";
        emailSignInBtn.style.display = "inline-block";
        signUpBtn.style.display = "inline-block";
        userMenu.style.display = "none";
        createPostCard.classList.remove("visible");
        bulkUploadBtn.style.display = "none";
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

editProfilePhotoBtn.addEventListener("click", () => {
    profilePhotoInput.click();
    userDropdown.classList.remove("active");
});

profilePhotoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );
        const result = await response.json();
        if (result.secure_url) {
            const photoURL = result.secure_url;
            await currentUser.updateProfile({ photoURL });
            userAvatar.src = photoURL;
            alert("Profile photo updated!");
        } else {
            throw new Error(result.error?.message || "Upload failed");
        }
    } catch (err) {
        alert("Failed to update photo: " + err.message);
    }
    profilePhotoInput.value = "";
});

logoutBtn.addEventListener("click", () => {
    auth.signOut();
    userDropdown.classList.remove("active");
});

// ========== SINGLE IMAGE HANDLING ==========
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

// ========== SUBMIT SINGLE POST ==========
submitPostBtn.addEventListener("click", async () => {
    if (!currentUser) return alert("You must be logged in to post.");
    const text = postText.value.trim();
    if (!text && !selectedImageFile) return alert("Please write something or add an image.");

    submitPostBtn.disabled = true;
    submitPostBtn.textContent = "Posting...";

    let imageUrl = null;
    if (selectedImageFile) {
        const formData = new FormData();
        formData.append("file", selectedImageFile);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: "POST", body: formData }
            );
            const result = await response.json();
            if (result.secure_url) {
                imageUrl = result.secure_url;
            } else {
                throw new Error(result.error?.message || "Cloudinary upload failed");
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

// ========== BULK UPLOAD (ADMIN ONLY) ==========
bulkUploadBtn.addEventListener("click", () => {
    bulkUploadInput.click();
});

bulkUploadInput.addEventListener("change", async () => {
    const files = bulkUploadInput.files;
    if (!files.length) return;

    const text = postText.value.trim();  // same caption for all
    if (!text) {
        if (!confirm("No caption entered. Continue with empty caption?")) return;
    }

    // Disable all buttons while uploading
    submitPostBtn.disabled = true;
    bulkUploadBtn.disabled = true;
    submitPostBtn.textContent = `Uploading 0/${files.length}...`;
    
    let uploaded = 0;
    for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: "POST", body: formData }
            );
            const result = await response.json();
            if (result.secure_url) {
                const postData = {
                    userId: currentUser.uid,
                    userName: currentUser.displayName || "Anonymous",
                    userPhoto: currentUser.photoURL || "",
                    text: text || "",
                    imageUrl: result.secure_url,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    likes: [],
                    likeCount: 0
                };
                await db.collection("posts").add(postData);
                uploaded++;
                submitPostBtn.textContent = `Uploading ${uploaded}/${files.length}...`;
            } else {
                console.error("Skipped file:", file.name, result.error?.message);
            }
        } catch (err) {
            console.error("Upload failed for", file.name, err);
        }
    }

    // Reset everything
    bulkUploadInput.value = "";
    postText.value = "";
    submitPostBtn.disabled = false;
    bulkUploadBtn.disabled = false;
    submitPostBtn.textContent = "Chirp";
    alert(`Bulk upload complete! ${uploaded} of ${files.length} photos posted.`);
    if (uploaded > 0) {
        // Clean up the single image preview if any
        selectedImageFile = null;
        imagePreviewContainer.style.display = "none";
        imageUploadInput.value = "";
    }
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
    const canDelete = isAdmin;   // ONLY admin can delete

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

    const likeBtn = card.querySelector(".like-btn");
    if (likeBtn) {
        likeBtn.addEventListener("click", () => toggleLike(post.id));
    }

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
    } catch (err) {
        alert("Delete failed: " + err.message);
    }
}

window.addEventListener("click", (e) => {
    if (e.target === authModal) authModal.classList.remove("active");
});
