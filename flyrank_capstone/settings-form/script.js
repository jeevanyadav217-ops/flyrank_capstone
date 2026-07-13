const STORAGE_KEY = 'flyrank-settings';

const DEFAULTS = {
  displayName: '',
  email: '',
  bio: '',
  timezone: 'UTC',
  emailNotifs: true,
  pushNotifs: false,
  weeklyDigest: true,
  notifFrequency: 'realtime',
  theme: 'light',
  fontSize: 'medium',
  compactMode: false,
  profileVisibility: 'team',
  showOnline: true,
  twoFactor: false,
  sessionTimeout: '60',
};

/** Load saved settings from localStorage, falling back to defaults. */
function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

/** Persist settings object to localStorage. */
function saveSettings(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Collect current form values into a settings object. */
function collectFormData(form) {
  return {
    displayName: form.displayName.value.trim(),
    email: form.email.value.trim(),
    bio: form.bio.value.trim(),
    timezone: form.timezone.value,
    emailNotifs: form.emailNotifs.checked,
    pushNotifs: form.pushNotifs.checked,
    weeklyDigest: form.weeklyDigest.checked,
    notifFrequency: form.notifFrequency.value,
    theme: form.querySelector('input[name="theme"]:checked')?.value ?? 'light',
    fontSize: form.fontSize.value,
    compactMode: form.compactMode.checked,
    profileVisibility: form.profileVisibility.value,
    showOnline: form.showOnline.checked,
    twoFactor: form.twoFactor.checked,
    sessionTimeout: form.sessionTimeout.value,
  };
}

/** Populate form fields from a settings object. */
function populateForm(form, data) {
  form.displayName.value = data.displayName;
  form.email.value = data.email;
  form.bio.value = data.bio;
  form.timezone.value = data.timezone;
  form.emailNotifs.checked = data.emailNotifs;
  form.pushNotifs.checked = data.pushNotifs;
  form.weeklyDigest.checked = data.weeklyDigest;
  form.notifFrequency.value = data.notifFrequency;
  form.fontSize.value = data.fontSize;
  form.compactMode.checked = data.compactMode;
  form.profileVisibility.value = data.profileVisibility;
  form.showOnline.checked = data.showOnline;
  form.twoFactor.checked = data.twoFactor;
  form.sessionTimeout.value = data.sessionTimeout;

  const themeRadio = form.querySelector(`input[name="theme"][value="${data.theme}"]`);
  if (themeRadio) themeRadio.checked = true;
}

/** Apply theme, font size, and compact mode to the document. */
function applyAppearance(data) {
  const root = document.documentElement;
  let resolvedTheme = data.theme;

  if (data.theme === 'system') {
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  root.setAttribute('data-theme', resolvedTheme);
  root.setAttribute('data-font-size', data.fontSize);
  root.setAttribute('data-compact', String(data.compactMode));
}

/** Validate required fields; returns true if valid. */
function validateForm(form) {
  let valid = true;

  const rules = [
    { field: form.displayName, message: 'Display name is required.' },
    {
      field: form.email,
      message: 'Please enter a valid email address.',
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    },
  ];

  rules.forEach(({ field, message, test }) => {
    const errorEl = document.querySelector(`[data-error="${field.name}"]`);
    const value = field.value.trim();
    const fieldValid = value && (!test || test(value));

    field.classList.toggle('field--invalid', !fieldValid);
    if (errorEl) errorEl.textContent = fieldValid ? '' : message;
    if (!fieldValid) valid = false;
  });

  return valid;
}

/** Show a temporary toast notification. */
function showToast(message, type = 'default') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast';
  if (type === 'success') toast.classList.add('toast--success');

  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, 3000);
}

/** Switch the active settings panel. */
function switchSection(sectionId) {
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('panel--active', panel.id === `section-${sectionId}`);
  });

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('nav-item--active', btn.dataset.section === sectionId);
  });
}

/** Initialize the settings form. */
function init() {
  const form = document.getElementById('settings-form');
  const bioInput = form.bio;
  const bioCount = document.getElementById('bio-count');
  const settings = loadSettings();

  populateForm(form, settings);
  applyAppearance(settings);
  bioCount.textContent = bioInput.value.length;

  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
  });

  // Live appearance preview
  form.querySelectorAll('input[name="theme"], #fontSize, #compactMode').forEach((el) => {
    el.addEventListener('change', () => applyAppearance(collectFormData(form)));
  });

  // Bio character counter
  bioInput.addEventListener('input', () => {
    bioCount.textContent = bioInput.value.length;
  });

  // System theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = collectFormData(form);
    if (current.theme === 'system') applyAppearance(current);
  });

  // Save
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm(form)) {
      switchSection('profile');
      showToast('Please fix the errors before saving.');
      return;
    }

    const data = collectFormData(form);
    saveSettings(data);
    applyAppearance(data);
    showToast('Settings saved successfully!', 'success');
  });

  // Reset
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;

    populateForm(form, DEFAULTS);
    applyAppearance(DEFAULTS);
    bioCount.textContent = '0';
    localStorage.removeItem(STORAGE_KEY);
    showToast('Settings reset to defaults.', 'success');
  });
}

document.addEventListener('DOMContentLoaded', init);
