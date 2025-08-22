// Accent color and year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu toggle
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');
menuBtn.addEventListener('click', () => {
  const open = nav.style.display === 'block';
  nav.style.display = open ? 'none' : 'block';
  menuBtn.setAttribute('aria-expanded', (!open).toString());
});

// --- Force-close mobile menu on link click (JS-only) ---
(function () {
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');
  if (!nav) return;

  const links = nav.querySelectorAll('a');

  function closeMenu() {
    // handle both strategies so it works with any CSS setup
    nav.classList.remove('open', 'active');
    nav.style.maxHeight = null;      // if you used animated max-height
    nav.style.display = 'none';      // if you used display toggle
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }

  links.forEach(link => {
    link.addEventListener('click', () => {
      // only collapse on small screens
      if (window.innerWidth <= 880) {
        closeMenu();
      }
    });
  });

  // optional: clean up styles when resizing back to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 880) {
      nav.style.maxHeight = '';
      nav.style.display = '';
      nav.classList.remove('open', 'active');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    }
  });
})();


// Reveal-on-scroll animations
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, {threshold: 0.12});
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Copy repayment details
document.querySelectorAll('.btn.copy').forEach(btn=>{
  btn.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'Copied!';
      setTimeout(()=>btn.textContent='Copy Details', 1600);
    }catch(err){ alert('Copy failed.'); }
  });
});

// --- Loan Form Submission (Formspree with validation) ---
const form = document.getElementById('loanForm');
const formMsg = document.getElementById('formMsg');
const FORMSPREE_URL = "https://formspree.io/f/mvgqjgaj";

function calcTotal(principal, flatInterest = 0.2){
  if(!principal) return 0;
  return Math.round(principal * (1 + flatInterest));
}

// Clear inline errors
function clearErrors() {
  document.querySelectorAll(".error").forEach(e => e.textContent = "");
}

// Show error under a specific field
function showError(field, message) {
  const errEl = document.getElementById("err-" + field);
  if(errEl) errEl.textContent = message;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  let valid = true;
  const data = Object.fromEntries(new FormData(form).entries());

  // --- Validation rules ---
  if (!data.fullName) { showError("fullName", "Please enter your full name."); valid = false; }
  if (!data.email) { showError("email", "Please enter your email."); valid = false; }
  if (!data.phone) { showError("phone", "Please enter your phone number."); valid = false; }
  if (!data.bvn) { showError("bvn", "Please enter your bvn number."); valid = false; }
  if (!data.state) { showError("state", "Please enter your state."); valid = false; }
  if (!data.localGovernmentArea) { showError("localGovernmentArea", "Please enter your local government area."); valid = false; }
  if (!data.address) { showError("address", "Please enter your house number and street name."); valid = false; }
  if (!data.loanType) { showError("loanType", "Please select a loan type."); valid = false; }
  if (!data.amount) { showError("amount", "Please enter the loan amount."); valid = false; }
  if (!data.tenor) { showError("tenor", "Please select a tenor."); valid = false; }
  if (!data.dueDate) { showError("dueDate", "Please select a due date."); valid = false; }
  if (!data.accountDetails) { showError("accountDetails", "Please input your bank account."); valid = false; }
  if (!data.agree) { showError("agree", "You must agree to continue."); valid = false; }

  if (!valid) {
    formMsg.style.color = "red";
    formMsg.textContent = "⚠️ Please fix the errors above.";
    return;
  }

  // Show repayment preview
  const amount = Number(data.amount);
  const total = calcTotal(amount);
  const planBox = document.getElementById('planBox');
  planBox.innerHTML = `<p><strong>Proposed Total:</strong> ₦${total.toLocaleString()} (20% flat)</p>
  <p><strong>Due Date:</strong> ${new Date(data.dueDate).toDateString()}</p>`;

  // Save due date locally (demo suspension logic)
  localStorage.setItem('demo_due_date', data.dueDate);
  localStorage.setItem('demo_paid', 'false');

  formMsg.textContent = 'Submitting application…';

  try {
    const res = await fetch(FORMSPREE_URL, {
      method: "POST",
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      form.reset();
      formMsg.style.color = "green";
      formMsg.textContent = "✅ Your loan application has been received! Check your email for confirmation.";
    } else {
      formMsg.style.color = "red";
      formMsg.textContent = "❌ Failed to submit. Please try again.";
    }
  } catch (err) {
    console.error(err);
    formMsg.style.color = "red";
    formMsg.textContent = "⚠️ Network error. Please check your connection.";
  }
});

// --- Demo “block account” logic (client only) ---
const GRACE_DAYS = 5;
const overlay = document.getElementById('suspend-overlay');

function isOverdue(){
  const due = localStorage.getItem('demo_due_date');
  const paid = localStorage.getItem('demo_paid') === 'true';
  if(!due) return false;
  const dueDate = new Date(due);
  const unlockDate = new Date(dueDate);
  unlockDate.setDate(unlockDate.getDate() + GRACE_DAYS);
  const now = new Date();
  return now > unlockDate && !paid;
}

function refreshSuspensionUI(){
  if(isOverdue()){
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }else{
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
}
refreshSuspensionUI();

// Demo buttons
document.getElementById('markPaidBtn').addEventListener('click', ()=>{
  localStorage.setItem('demo_paid','true');
  alert('Marked as paid . Any suspension will be lifted locally.');
  refreshSuspensionUI();
});
document.getElementById('checkStatusBtn').addEventListener('click', ()=>{
  alert(isOverdue() ? 'Status: SUSPENDED ' : 'Status: ACTIVE ');
});
document.getElementById('request-review-btn').addEventListener('click', ()=>{
  localStorage.setItem('demo_paid','true');
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
  alert('Review request sent (demo). In production this notifies support.');
});

// Optional: smooth-scroll for nav
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if(target){
      e.preventDefault();
      target.scrollIntoView({behavior:'smooth', block:'start'});
      if(window.innerWidth<=880){ nav.style.display='none'; menuBtn.setAttribute('aria-expanded','false'); }
    }
  });
});
