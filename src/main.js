
// ============================================================
// CONSOLIDATED USER AUTH & APP INITIALIZATION
// ============================================================

import { app, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from './firebase-config.js'

// --- HELPER: get root path relative to current page ---
function getRootPath() {
  return window.location.pathname.includes('/src/') ? '../../' : './'
}

function getSignInPath() {
  return window.location.pathname.includes('/src/') ? '../Pages/Sign-in.html' : './src/Pages/Sign-in.html'
}

// --- USER AUTH FUNCTIONS ---
function initUserAuth() {
  try {
    const raw = localStorage.getItem('handtime_user')
    const signInBtn = document.getElementById('btn-signin')
    const bottomSignInBtn = document.getElementById('bottom-signin-btn')
    const signInSection = document.getElementById('home-signin-section')
    const userBadge = document.getElementById('user-badge')

    // Default: show sign-in buttons, hide badge
    if (signInBtn) signInBtn.style.display = 'block'
    if (bottomSignInBtn) bottomSignInBtn.style.display = 'inline-block'
    if (signInSection) signInSection.style.display = 'block'
    if (userBadge) {
      userBadge.classList.add('hidden')
      userBadge.classList.remove('flex')
    }

    if (!raw) return

    const user = JSON.parse(raw)
    if (!user || !user.loggedIn) return

    // Hide sign-in buttons, show user badge
    if (signInBtn) signInBtn.style.display = 'none'
    if (bottomSignInBtn) bottomSignInBtn.style.display = 'none'
    if (signInSection) signInSection.style.display = 'none'
    if (userBadge) {
      userBadge.classList.remove('hidden')
      userBadge.classList.add('flex')
    }

    // Show user name/email in badge
    const firstName = user.name ? user.name.split(' ')[0] : 'User'
    const userId = user.email ? user.email.split('@')[0] : firstName
    const badgeName = document.getElementById('user-badge-name')
    const dropdownName = document.getElementById('dropdown-name')
    const dropdownEmail = document.getElementById('dropdown-email')

    if (badgeName) badgeName.textContent = userId
    if (dropdownName) dropdownName.textContent = user.name || ''
    if (dropdownEmail) dropdownEmail.textContent = user.email || ''

  } catch (e) {
    console.log('Auth init error:', e)
  }
}

function goToSignIn() {
  sessionStorage.setItem('signin_return', window.location.href)
  window.location.href = getSignInPath()
}

function toggleUserMenu() {
  const dropdown = document.getElementById('user-dropdown')
  if (dropdown) dropdown.classList.toggle('hidden')
}

function signOut(e) {
  if (e) e.stopPropagation()
  localStorage.removeItem('handtime_user')
  const root = getRootPath()
  firebaseSignOut(auth).then(() => {
    window.location.href = root + 'index.html'
  }).catch(() => {
    window.location.href = root + 'index.html'
  })
}

// ============================================================
// FIREBASE AUTH INTEGRATION
// ============================================================

window.handleSignIn = async function () {
  const nameInput = document.getElementById('signin-name')
  const mobileInput = document.getElementById('signin-mobile')
  const emailInput = document.getElementById('signin-email')
  const passwordInput = document.getElementById('signin-password')
  const errorBox = document.getElementById('signin-error')
  const loadingBox = document.getElementById('signin-loading')
  const successBox = document.getElementById('signin-success')

  if (!nameInput || !emailInput || !passwordInput) return

  const name = nameInput.value.trim()
  const mobile = mobileInput ? mobileInput.value.trim() : ''
  const email = emailInput.value.trim()
  const password = passwordInput.value

  if (errorBox) errorBox.classList.add('hidden')
  if (successBox) successBox.classList.add('hidden')
  if (loadingBox) loadingBox.classList.remove('hidden')

  if (!name || !email || !password) {
    if (errorBox) { errorBox.textContent = 'Please fill in your name, email, and password.'; errorBox.classList.remove('hidden') }
    if (loadingBox) loadingBox.classList.add('hidden')
    return
  }

  if (!email.includes('@') || !email.includes('.')) {
    if (errorBox) { errorBox.textContent = 'Please enter a valid email address.'; errorBox.classList.remove('hidden') }
    if (loadingBox) loadingBox.classList.add('hidden')
    return
  }

  if (password.length < 6) {
    if (errorBox) { errorBox.textContent = 'Password must be at least 6 characters.'; errorBox.classList.remove('hidden') }
    if (loadingBox) loadingBox.classList.add('hidden')
    return
  }

  // Helper to save user and redirect
  function saveAndRedirect(userData, message) {
    localStorage.setItem('handtime_user', JSON.stringify(userData))
    if (loadingBox) loadingBox.classList.add('hidden')
    if (successBox) {
      successBox.textContent = message
      successBox.classList.remove('hidden')
    }
    setTimeout(() => {
      // Always go back to stored URL, or fall back to root index.html
      const stored = sessionStorage.getItem('signin_return')
      sessionStorage.removeItem('signin_return')
      // Use stored URL if it exists and is not the sign-in page itself
      if (stored && !stored.includes('Sign-in.html')) {
        window.location.href = stored
      } else {
        // Navigate to root index.html relative to Sign-in.html location
        window.location.href = '../../index.html'
      }
    }, 1200)
  }

  if (!auth) {
    // No Firebase — save locally and redirect
    saveAndRedirect({
      name, mobile, email,
      loggedIn: true,
      loginTime: Date.now()
    }, 'Signed in! Redirecting...')
    return
  }

  try {
    // Try creating new account first
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    saveAndRedirect({
      uid: user.uid, name, mobile,
      email: user.email,
      loggedIn: true,
      loginTime: Date.now()
    }, 'Account created! Redirecting...')

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      // Account exists — try signing in instead
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        saveAndRedirect({
          uid: user.uid, name, mobile,
          email: user.email,
          loggedIn: true,
          loginTime: Date.now()
        }, 'Welcome back! Redirecting...')

      } catch (signInError) {
        if (loadingBox) loadingBox.classList.add('hidden')
        if (errorBox) {
          errorBox.textContent = signInError.code === 'auth/wrong-password'
            ? 'Wrong password. Please try again.'
            : 'Email already registered. Check your password.'
          errorBox.classList.remove('hidden')
        }
      }

    } else if (error.code === 'auth/invalid-email') {
      if (loadingBox) loadingBox.classList.add('hidden')
      if (errorBox) { errorBox.textContent = 'Invalid email address.'; errorBox.classList.remove('hidden') }

    } else if (error.code === 'auth/weak-password') {
      if (loadingBox) loadingBox.classList.add('hidden')
      if (errorBox) { errorBox.textContent = 'Password is too weak. Use at least 6 characters.'; errorBox.classList.remove('hidden') }

    } else {
      if (loadingBox) loadingBox.classList.add('hidden')
      if (errorBox) { errorBox.textContent = 'Error: ' + error.message; errorBox.classList.remove('hidden') }
    }
  }
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Firebase user logged in:', user.email)
  } else {
    console.log('Firebase user logged out')
  }
})

// ============================================================
// LOAD ADMIN PRODUCTS (Products Page)
// ============================================================

var ORIGINAL_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])

function loadAdminProducts() {
  try {
    var saved = localStorage.getItem('handtime_admin_products')
    if (!saved) return
    var all = JSON.parse(saved)
    if (!Array.isArray(all)) return

    var adminAdded = all.filter(function (p) { return !ORIGINAL_IDS.has(p.id) })
    if (adminAdded.length === 0) return

    var section = document.getElementById('admin-products-section')
    var grid = document.getElementById('admin-products-grid')
    if (!section || !grid) return

    section.classList.remove('hidden')

    adminAdded.forEach(function (product) {
      var card = document.createElement('div')
      card.className = 'bg-white p-6 rounded-md shadow-sm text-center hover:shadow-xl transition cursor-pointer w-full md:w-[30%]'
      card.innerHTML =
        '<img class="h-40 mx-auto mb-6 object-contain" src="' + product.image + '" alt="' + product.name + '" onerror="this.src=\'../Components/images/w1.png\'">' +
        '<div class="flex justify-between items-center">' +
        '<div><h6 class="text-sm font-semibold">' + product.name + '</h6><h5 class="text-lg font-bold">$ ' + product.price + '</h5></div>' +
        '<div class="text-right">' +
        '<h6 class="text-sm font-semibold mb-1 flex justify-center">Like</h6>' +
        '<div class="text-sm">' +
        '<i class="fa fa-star text-orange-600"></i><i class="fa fa-star text-orange-600"></i>' +
        '<i class="fa fa-star text-orange-600"></i><i class="fa fa-star text-orange-600"></i>' +
        '<i class="fa fa-star text-orange-600"></i>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<button class="mt-6 bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 cursor-pointer">Add To Cart</button>'
      grid.appendChild(card)
    })
  } catch (e) { }
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================

let products = []
let currentEditingId = null
let tempImageDataUrl = null

const orders = [
  { id: 1001, customer: "Ahmed Khan", product: "Men's Watch", amount: 300, status: "Delivered", date: "2026-04-18" },
  { id: 1002, customer: "Sana Malik", product: "Female Watch", amount: 200, status: "Shipped", date: "2026-04-19" },
  { id: 1003, customer: "Bilal Raza", product: "Smart Watch", amount: 500, status: "Processing", date: "2026-04-20" }
]

const initialProducts = [
  { id: 1, name: "Men's Watch", category: "Men", price: 300, image: "../Components/images/w1.png" },
  { id: 2, name: "Men's Watch", category: "Men", price: 300, image: "../Components/images/w2.png" },
  { id: 3, name: "Men's Watch", category: "Men", price: 300, image: "../Components/images/w3.png" },
  { id: 4, name: "Men's Watch", category: "Men", price: 300, image: "../Components/images/w4.png" },
  { id: 5, name: "Men's Watch", category: "Men", price: 300, image: "../Components/images/w5.png" },
  { id: 6, name: "Men's Watch", category: "Men", price: 300, image: "../Components/images/w6.png" },
  { id: 7, name: "Female Watch", category: "Female", price: 200, image: "../Components/images/w10.png" },
  { id: 8, name: "Female Watch", category: "Female", price: 200, image: "../Components/images/w11.png.jpg" },
  { id: 9, name: "Female Watch", category: "Female", price: 200, image: "../Components/images/w12.png.jpg" },
  { id: 10, name: "Digital Watch", category: "Digital", price: 400, image: "../Components/images/w19.png" },
  { id: 11, name: "Smart Watch", category: "Smart", price: 500, image: "../Components/images/w22.png" },
  { id: 12, name: "Digital Watch", category: "Digital", price: 400, image: "../Components/images/d1.png" }
]

function loadProducts() {
  try {
    const saved = localStorage.getItem('handtime_admin_products')
    if (saved) {
      const parsed = JSON.parse(saved)
      products = (Array.isArray(parsed) && parsed.length > 0) ? parsed : [...initialProducts]
    } else {
      products = [...initialProducts]
    }
  } catch (e) {
    products = [...initialProducts]
  }
  saveProducts()
  updateStats()
  renderProducts(products)
}

function saveProducts() {
  try {
    localStorage.setItem('handtime_admin_products', JSON.stringify(products))
  } catch (e) { }
  updateStats()
  showSaveToast()
}

function showSaveToast() {
  let toast = document.getElementById('save-toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'save-toast'
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;background:#7c3aed;color:#fff;padding:12px 20px;border-radius:14px;font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.2);display:flex;align-items:center;gap:8px;transition:opacity 0.4s ease;'
    document.body.appendChild(toast)
  }
  toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> Saved!'
  toast.style.opacity = '1'
  clearTimeout(toast._timer)
  toast._timer = setTimeout(function () { toast.style.opacity = '0' }, 2500)
}

function renderProducts(filteredProducts) {
  const tbody = document.getElementById('products-tbody')
  if (!tbody) return
  tbody.innerHTML = ''

  filteredProducts.forEach(product => {
    const row = document.createElement('tr')
    row.className = 'hover:bg-violet-50 transition-colors'
    row.innerHTML = `
      <td class="pl-8 py-5">
        <img src="${product.image}" alt="${product.name}" class="w-12 h-12 object-cover rounded-2xl border border-gray-100">
      </td>
      <td class="py-5 font-medium">${product.name}</td>
      <td class="py-5">
        <span class="inline-flex px-3 py-1 rounded-3xl text-xs font-medium
                     ${product.category === 'Men' ? 'bg-blue-100 text-blue-700' : ''}
                     ${product.category === 'Female' ? 'bg-pink-100 text-pink-700' : ''}
                     ${product.category === 'Digital' ? 'bg-amber-100 text-amber-700' : ''}
                     ${product.category === 'Smart' ? 'bg-purple-100 text-purple-700' : ''}">
          ${product.category}
        </span>
      </td>
      <td class="py-5 font-semibold">$${product.price}</td>
      <td class="py-5 text-center">
        <button onclick="editProduct(${product.id})" class="text-violet-600 hover:text-violet-700 px-3 py-1 rounded-2xl hover:bg-violet-50">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button onclick="deleteProduct(${product.id})" class="text-red-500 hover:text-red-600 px-3 py-1 rounded-2xl hover:bg-red-50 ml-2">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `
    tbody.appendChild(row)
  })

  if (filteredProducts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-12 text-gray-400">No products found</td></tr>`
  }
}

function renderOrders() {
  const tbody = document.getElementById('orders-tbody')
  if (!tbody) return
  tbody.innerHTML = ''
  orders.forEach(order => {
    const statusColor = order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
      order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
    const row = document.createElement('tr')
    row.innerHTML = `
      <td class="pl-8 py-5 font-medium">#${order.id}</td>
      <td class="py-5">${order.customer}</td>
      <td class="py-5">${order.product}</td>
      <td class="py-5 font-semibold">$${order.amount}</td>
      <td class="py-5 text-center">
        <span class="inline-flex px-4 py-1 rounded-3xl text-xs font-semibold ${statusColor}">${order.status}</span>
      </td>
    `
    tbody.appendChild(row)
  })
}

function updateStats() {
  const statProducts = document.getElementById('stat-products')
  const statOrders = document.getElementById('stat-orders')
  const statRevenue = document.getElementById('stat-revenue')
  const statUsers = document.getElementById('stat-users')

  if (statProducts) statProducts.textContent = products.length
  if (statOrders) statOrders.textContent = orders.length + 139
  if (statRevenue) statRevenue.textContent = '$18,420'
  if (statUsers) statUsers.textContent = '1,284'
}

function showPanel(panel) {
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'))
  const target = document.getElementById(panel + '-panel')
  if (target) target.classList.remove('hidden')

  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active', 'bg-violet-50', 'text-violet-700'))
  const activeNav = document.getElementById('nav-' + panel)
  if (activeNav) activeNav.classList.add('active', 'bg-violet-50', 'text-violet-700')

  if (window.innerWidth < 1024) {
    const sidebar = document.getElementById('adminSidebar')
    const overlay = document.getElementById('mobileSidebarOverlay')
    if (sidebar) sidebar.classList.add('-translate-x-full')
    if (overlay) overlay.classList.add('hidden')
  }

  if (panel === 'products') renderProducts(products)
  else if (panel === 'orders') renderOrders()
}

function filterProducts() {
  const term = document.getElementById('product-search').value.toLowerCase().trim()
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(term) ||
    p.category.toLowerCase().includes(term)
  )
  renderProducts(filtered)
}

function showAddProductModal() {
  currentEditingId = null
  tempImageDataUrl = null
  document.getElementById('modal-title').textContent = 'Add New Product'
  document.getElementById('product-form').reset()
  document.getElementById('image-preview').src = '../Components/images/w1.png'
  document.getElementById('file-name').textContent = 'No file chosen'
  document.getElementById('product-modal').classList.remove('hidden')
  document.getElementById('product-modal').classList.add('flex')
}

function editProduct(id) {
  const product = products.find(p => p.id === id)
  if (!product) return

  currentEditingId = id
  tempImageDataUrl = null
  document.getElementById('modal-title').textContent = 'Edit Product'
  document.getElementById('form-name').value = product.name
  document.getElementById('form-category').value = product.category
  document.getElementById('form-price').value = product.price
  document.getElementById('image-preview').src = product.image
  document.getElementById('file-name').textContent = 'Current image'
  document.getElementById('product-modal').classList.remove('hidden')
  document.getElementById('product-modal').classList.add('flex')
}

function previewUploadedImage(e) {
  const file = e.target.files[0]
  if (!file) return
  document.getElementById('file-name').textContent = file.name
  const reader = new FileReader()
  reader.onload = function (ev) {
    tempImageDataUrl = ev.target.result
    document.getElementById('image-preview').src = tempImageDataUrl
  }
  reader.readAsDataURL(file)
}

function handleProductForm(e) {
  e.preventDefault()
  const name = document.getElementById('form-name').value.trim()
  const category = document.getElementById('form-category').value
  const price = parseInt(document.getElementById('form-price').value)

  if (currentEditingId !== null) {
    const product = products.find(p => p.id === currentEditingId)
    if (product) {
      product.name = name
      product.category = category
      product.price = price
      if (tempImageDataUrl) product.image = tempImageDataUrl
    }
  } else {
    products.unshift({
      id: Date.now(), name, category, price,
      image: tempImageDataUrl || '../Components/images/w1.png'
    })
  }

  saveProducts()
  hideModal()
  renderProducts(products)
}

function deleteProduct(id) {
  if (!confirm('Delete this product permanently?')) return
  products = products.filter(p => p.id !== id)
  saveProducts()
  renderProducts(products)
}

function hideModal() {
  const modal = document.getElementById('product-modal')
  if (modal) {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
  }
  currentEditingId = null
  tempImageDataUrl = null
}

function logout() {
  if (confirm('Logout from Admin Panel?')) {
    sessionStorage.removeItem('ht_admin_auth')
    window.location.reload()
  }
}

function clearAllProducts() {
  if (!confirm('Delete ALL products? This will restore defaults.')) return
  products = [...initialProducts]
  saveProducts()
  renderProducts(products)
}

// --- ADMIN LOGIN ---
const ADMIN_EMAIL = 'admin@HANDTIME.com'
const ADMIN_PASSWORD = 'Admin@1234'

function attemptLogin() {
  const emailInput = document.getElementById('admin-email')
  const passInput = document.getElementById('admin-password')
  const errorBox = document.getElementById('login-error')
  const errorMsg = document.getElementById('login-error-msg')

  if (!emailInput || !passInput || !errorBox || !errorMsg) return

  const email = emailInput.value.trim()
  const password = passInput.value

  emailInput.classList.remove('error-field')
  passInput.classList.remove('error-field')
  errorBox.style.display = 'none'

  if (!email || !password) {
    errorMsg.textContent = 'Please enter both email and password.'
    errorBox.style.display = 'block'
    if (!email) emailInput.classList.add('error-field')
    if (!password) passInput.classList.add('error-field')
    return
  }

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    sessionStorage.setItem('ht_admin_auth', 'true')
    const overlay = document.getElementById('login-overlay')
    if (overlay) {
      overlay.classList.add('hide')
      setTimeout(() => overlay.style.display = 'none', 420)
    }
  } else {
    emailInput.classList.add('error-field')
    passInput.classList.add('error-field')
    passInput.value = ''
    errorMsg.textContent = 'Incorrect email or password. Please try again.'
    errorBox.style.display = 'none'
    void errorBox.offsetWidth
    errorBox.style.display = 'block'
  }
}

function togglePasswordVisibility() {
  const input = document.getElementById('admin-password')
  const icon = document.getElementById('toggle-eye')
  if (!input || !icon) return
  if (input.type === 'password') {
    input.type = 'text'
    icon.classList.replace('fa-eye', 'fa-eye-slash')
  } else {
    input.type = 'password'
    icon.classList.replace('fa-eye-slash', 'fa-eye')
  }
}

// --- MOBILE MENU ---
function initMobileMenu() {
  const menuBtn = document.getElementById('menuBtn')
  const menuIcon = document.getElementById('menuIcon')
  const mobileMenu = document.getElementById('mobileMenu')

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      const isHidden = mobileMenu.classList.contains('hidden')
      mobileMenu.classList.toggle('hidden')
      if (menuIcon) {
        menuIcon.classList.toggle('fa-bars', !isHidden)
        menuIcon.classList.toggle('fa-xmark', isHidden)
      }
    })
  }
}

// --- CLICK OUTSIDE TO CLOSE DROPDOWN ---
document.addEventListener('click', function (e) {
  const badge = document.getElementById('user-badge')
  const dd = document.getElementById('user-dropdown')
  if (dd && badge && !badge.contains(e.target)) {
    dd.classList.add('hidden')
  }
})

// --- MAIN INITIALIZATION ---
window.onload = function () {
  initUserAuth()
  loadAdminProducts()
  initMobileMenu()

  const loginOverlay = document.getElementById('login-overlay')
  if (loginOverlay) {
    loadProducts()
    showPanel('dashboard')
    if (sessionStorage.getItem('ht_admin_auth') === 'true') {
      loginOverlay.style.display = 'none'
    }
  }
}

// --- EXPOSE ALL FUNCTIONS TO WINDOW ---
window.attemptLogin = attemptLogin
window.togglePasswordVisibility = togglePasswordVisibility
window.showPanel = showPanel
window.goToSignIn = goToSignIn
window.toggleUserMenu = toggleUserMenu
window.signOut = signOut
window.logout = logout
window.showAddProductModal = showAddProductModal
window.editProduct = editProduct
window.deleteProduct = deleteProduct
window.hideModal = hideModal
window.filterProducts = filterProducts
window.previewUploadedImage = previewUploadedImage
window.handleProductForm = handleProductForm
window.clearAllProducts = clearAllProducts
window.toggleMobileSidebar = function () {
  if (window.innerWidth >= 1024) return
  const sidebar = document.getElementById('adminSidebar')
  const overlay = document.getElementById('mobileSidebarOverlay')
  if (!sidebar) return
  const isHidden = sidebar.classList.contains('-translate-x-full')
  sidebar.classList.toggle('-translate-x-full')
  if (overlay) overlay.classList.toggle('hidden', !isHidden)
}