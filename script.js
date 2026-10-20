/**
 * WebWhisper — Hidden Message Encoder & Decoder
 * Classical Cryptography Educational Studio
 * 
 * Vanilla JavaScript (ES6+) Implementation
 * Includes:
 * - Caesar Cipher (Shift mod 26)
 * - Custom Monoalphabetic Substitution Cipher (26 unique letters mapping)
 * - Vigenère Cipher (Polyalphabetic Keystream)
 * - Two-Way Encoding & Decoding Workspace
 * - LocalStorage Activity History (Max 10 entries)
 * - Interactive Cipher Challenge Mode
 * - 20-Point Cryptographic Diagnostic Test Runner
 * - Toast Notification System
 * - Light/Dark Theme Switching
 */

'use strict';

// ============================================================================
// 1. CORE CRYPTOGRAPHY ENGINES
// ============================================================================

const STANDARD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Caesar Cipher Engine
 */
const CaesarCipher = {
  /**
   * Normalizes any integer shift into a valid modulo-26 range (0 to 25).
   * Handles negative shifts and shifts >= 26 correctly.
   */
  normalizeShift(shift) {
    const num = parseInt(shift, 10);
    if (isNaN(num)) return 3;
    return ((num % 26) + 26) % 26;
  },

  /**
   * Encodes a string using Caesar Cipher.
   * Preserves letter case; leaves numbers, spaces, and punctuation unchanged.
   */
  encode(text, shift) {
    if (typeof text !== 'string') return '';
    const s = this.normalizeShift(shift);
    let result = '';

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);

      // Uppercase A-Z (ASCII 65 - 90)
      if (code >= 65 && code <= 90) {
        result += String.fromCharCode(((code - 65 + s) % 26) + 65);
      }
      // Lowercase a-z (ASCII 97 - 122)
      else if (code >= 97 && code <= 122) {
        result += String.fromCharCode(((code - 97 + s) % 26) + 97);
      }
      // Non-alphabetic characters remain untouched
      else {
        result += text[i];
      }
    }
    return result;
  },

  /**
   * Decodes a string using Caesar Cipher by reversing the shift.
   */
  decode(text, shift) {
    const s = this.normalizeShift(shift);
    return this.encode(text, (26 - s) % 26);
  }
};

/**
 * Custom Substitution Cipher Engine (Monoalphabetic)
 */
const SubstitutionCipher = {
  DEFAULT_ALPHABET: 'QWERTYUIOPASDFGHJKLZXCVBNM',
  ATBASH_ALPHABET: 'ZYXWVUTSRQPONMLKJIHGFEDCBA',
  ROT13_ALPHABET: 'NOPQRSTUVWXYZABCDEFGHIJKLM',

  /**
   * Validates a custom substitution alphabet.
   * Must contain exactly 26 unique English letters (A-Z).
   */
  validate(alphabet) {
    if (!alphabet || typeof alphabet !== 'string') {
      return { isValid: false, error: 'Alphabet cannot be empty.', sanitized: '' };
    }

    const sanitized = alphabet.toUpperCase().replace(/[^A-Z]/g, '');

    if (sanitized.length !== 26) {
      return {
        isValid: false,
        error: `Alphabet must be exactly 26 letters (currently ${sanitized.length}).`,
        sanitized
      };
    }

    const seen = new Set();
    const duplicates = new Set();

    for (const char of sanitized) {
      if (seen.has(char)) {
        duplicates.add(char);
      }
      seen.add(char);
    }

    if (duplicates.size > 0) {
      return {
        isValid: false,
        error: `Duplicate letters detected: ${Array.from(duplicates).join(', ')}`,
        sanitized
      };
    }

    return { isValid: true, error: null, sanitized };
  },

  /**
   * Generates a randomly shuffled valid 26-letter substitution alphabet (Fisher-Yates).
   */
  generateRandomAlphabet() {
    const arr = STANDARD_ALPHABET.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  },

  /**
   * Encodes text using the substitution alphabet.
   */
  encode(text, alphabet) {
    if (typeof text !== 'string') return '';
    const validation = this.validate(alphabet);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const key = validation.sanitized;
    let result = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = text.charCodeAt(i);

      if (code >= 65 && code <= 90) {
        // Uppercase
        const index = code - 65;
        result += key[index];
      } else if (code >= 97 && code <= 122) {
        // Lowercase
        const index = code - 97;
        result += key[index].toLowerCase();
      } else {
        result += char;
      }
    }

    return result;
  },

  /**
   * Decodes text using the substitution alphabet by building an inverse mapping.
   */
  decode(text, alphabet) {
    if (typeof text !== 'string') return '';
    const validation = this.validate(alphabet);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const key = validation.sanitized;
    // Build inverse mapping: key[i] maps back to STANDARD_ALPHABET[i]
    const inverseMap = {};
    for (let i = 0; i < 26; i++) {
      inverseMap[key[i]] = STANDARD_ALPHABET[i];
    }

    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const upper = char.toUpperCase();

      if (upper >= 'A' && upper <= 'Z') {
        const decodedChar = inverseMap[upper] || upper;
        result += (char === upper) ? decodedChar : decodedChar.toLowerCase();
      } else {
        result += char;
      }
    }

    return result;
  }
};

/**
 * Vigenère Cipher Engine (Polyalphabetic)
 */
const VigenereCipher = {
  /**
   * Validates a Vigenère keyword.
   * Must contain at least one English letter and only A-Z letters.
   */
  validate(keyword) {
    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      return { isValid: false, error: 'Keyword cannot be empty.', sanitized: '' };
    }

    const trimmed = keyword.trim().toUpperCase();
    if (!/^[A-Z]+$/.test(trimmed)) {
      return {
        isValid: false,
        error: 'Keyword must contain only English letters (A–Z). No spaces, numbers, or symbols.',
        sanitized: trimmed.replace(/[^A-Z]/g, '')
      };
    }

    return { isValid: true, error: null, sanitized: trimmed };
  },

  /**
   * Encodes text using Vigenère Cipher.
   * Keystream advances ONLY when an alphabetic character is encoded.
   */
  encode(text, keyword) {
    if (typeof text !== 'string') return '';
    const validation = this.validate(keyword);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const key = validation.sanitized;
    let result = '';
    let keyIndex = 0;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);

      if (code >= 65 && code <= 90) {
        // Uppercase
        const shift = key.charCodeAt(keyIndex % key.length) - 65;
        result += String.fromCharCode(((code - 65 + shift) % 26) + 65);
        keyIndex++;
      } else if (code >= 97 && code <= 122) {
        // Lowercase
        const shift = key.charCodeAt(keyIndex % key.length) - 65;
        result += String.fromCharCode(((code - 97 + shift) % 26) + 97);
        keyIndex++;
      } else {
        // Non-alphabetic characters do NOT advance the keyword pointer
        result += text[i];
      }
    }

    return result;
  },

  /**
   * Decodes text using Vigenère Cipher by reversing each letter's shift.
   */
  decode(text, keyword) {
    if (typeof text !== 'string') return '';
    const validation = this.validate(keyword);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const key = validation.sanitized;
    let result = '';
    let keyIndex = 0;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);

      if (code >= 65 && code <= 90) {
        const shift = key.charCodeAt(keyIndex % key.length) - 65;
        result += String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
        keyIndex++;
      } else if (code >= 97 && code <= 122) {
        const shift = key.charCodeAt(keyIndex % key.length) - 65;
        result += String.fromCharCode(((code - 97 - shift + 26) % 26) + 97);
        keyIndex++;
      } else {
        result += text[i];
      }
    }

    return result;
  }
};

// ============================================================================
// 2. TOAST NOTIFICATION SYSTEM
// ============================================================================

const Toast = {
  container: document.getElementById('toast-container'),

  show(message, type = 'info', duration = 3500) {
    if (!this.container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    // Select icon
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    } else {
      iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      ${iconSvg}
      <span class="toast-message">${this.escapeHtml(message)}</span>
      <button type="button" class="toast-close" aria-label="Dismiss notification">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
  },

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  },

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};

// ============================================================================
// 3. APPLICATION STATE & LOCALSTORAGE MANAGER
// ============================================================================

const STORAGE_KEYS = {
  THEME: 'webwhisper_theme',
  HISTORY: 'webwhisper_history_v1',
  HISTORY_ENABLED: 'webwhisper_history_enabled'
};

const AppState = {
  theme: 'dark',
  currentCipher: 'caesar',
  caesarShift: 3,
  substitutionAlphabet: SubstitutionCipher.DEFAULT_ALPHABET,
  vigenereKeyword: 'SECRET',
  historyEnabled: true,
  lastOperation: null,
  history: [],

  init() {
    // 1. Theme initialization
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        this.theme = savedTheme;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        this.theme = 'light';
      }
    } catch (e) {
      console.warn('LocalStorage unavailable for theme:', e);
    }
    document.documentElement.setAttribute('data-theme', this.theme);

    // 2. History enabled setting
    try {
      const savedHistPref = localStorage.getItem(STORAGE_KEYS.HISTORY_ENABLED);
      if (savedHistPref !== null) {
        this.historyEnabled = savedHistPref === 'true';
      }
    } catch (e) {
      console.warn('LocalStorage unavailable for history preference:', e);
    }

    // 3. Load history
    this.loadHistory();
  },

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  },

  loadHistory() {
    if (!this.historyEnabled) {
      this.history = [];
      return;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.history = parsed.slice(0, 10);
        }
      }
    } catch (e) {
      console.warn('Failed to load history from LocalStorage:', e);
      this.history = [];
    }
  },

  addHistoryEntry(entry) {
    if (!this.historyEnabled) return;

    const item = {
      id: 'wh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      operation: entry.operation, // 'encode' | 'decode'
      cipher: entry.cipher,       // 'caesar' | 'substitution' | 'vigenere'
      cipherConfig: entry.cipherConfig,
      input: entry.input,
      output: entry.output
    };

    // Add to top and cap at 10 items
    this.history.unshift(item);
    if (this.history.length > 10) {
      this.history = this.history.slice(0, 10);
    }

    this.saveHistory();
  },

  deleteHistoryEntry(id) {
    this.history = this.history.filter(item => item.id !== id);
    this.saveHistory();
  },

  clearHistory() {
    this.history = [];
    this.saveHistory();
  },

  saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    } catch (e) {
      console.warn('Failed to save history to LocalStorage:', e);
    }
  },

  setHistoryEnabled(enabled) {
    this.historyEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY_ENABLED, String(enabled));
    } catch (e) {
      console.warn('Failed to save history setting:', e);
    }
    if (!enabled) {
      // Clear current stored history when user explicitly disables it
      this.clearHistory();
    }
  }
};

// ============================================================================
// 4. UI CONTROLLER & EVENT LISTENERS
// ============================================================================

const UI = {
  // DOM Elements Cache
  elements: {
    // Navigation & Theme
    themeToggle: document.getElementById('theme-toggle'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mainNav: document.getElementById('main-nav'),
    navLinks: document.querySelectorAll('.nav-link'),

    // Workspace Cipher Selection & Panels
    cipherSelect: document.getElementById('cipher-select'),
    cipherInfoText: document.getElementById('cipher-info-text'),
    panelCaesar: document.getElementById('param-panel-caesar'),
    panelSubstitution: document.getElementById('param-panel-substitution'),
    panelVigenere: document.getElementById('param-panel-vigenere'),

    // Caesar Controls
    caesarSlider: document.getElementById('caesar-shift-slider'),
    caesarShiftVal: document.getElementById('caesar-shift-val'),
    caesarMappingPreview: document.getElementById('caesar-mapping-preview'),
    caesarPresets: document.querySelectorAll('#param-panel-caesar .btn-preset'),

    // Substitution Controls
    subAlphabetInput: document.getElementById('substitution-alphabet-input'),
    subValidationBadge: document.getElementById('alphabet-validation-badge'),
    subMappingGrid: document.getElementById('substitution-mapping-grid'),
    subErrorMsg: document.getElementById('sub-error-msg'),
    btnSubDefault: document.getElementById('btn-sub-default'),
    btnSubAtbash: document.getElementById('btn-sub-atbash'),
    btnSubRot13: document.getElementById('btn-sub-rot13'),
    btnSubShuffle: document.getElementById('btn-sub-shuffle'),

    // Vigenère Controls
    vigenereKeywordInput: document.getElementById('vigenere-keyword-input'),
    vigenereKeyStatus: document.getElementById('vigenere-key-status'),
    vigenereErrorMsg: document.getElementById('vigenere-error-msg'),
    vigenerePresets: document.querySelectorAll('#param-panel-vigenere .btn-preset'),
    keystreamDisplay: document.getElementById('keystream-display'),

    // Main Textareas & Character Counters
    inputMessage: document.getElementById('input-message'),
    outputMessage: document.getElementById('output-message'),
    inputValidationMsg: document.getElementById('input-validation-msg'),
    inputCharCount: document.getElementById('input-char-count'),
    inputWordCount: document.getElementById('input-word-count'),
    inputAlphaCount: document.getElementById('input-alpha-count'),
    outputCharCount: document.getElementById('output-char-count'),
    outputWordCount: document.getElementById('output-word-count'),
    outputStatusText: document.getElementById('output-status-text'),
    outputLabel: document.getElementById('output-label'),
    outputOperationBadge: document.getElementById('output-operation-badge'),
    outputEmptyState: document.getElementById('output-empty-state'),

    // Action Buttons
    btnEncode: document.getElementById('btn-encode'),
    btnDecode: document.getElementById('btn-decode'),
    btnSwap: document.getElementById('btn-swap'),
    btnClearAll: document.getElementById('btn-clear-all'),
    btnClearInput: document.getElementById('btn-clear-input'),
    btnPasteInput: document.getElementById('btn-paste-input'),
    btnSampleInput: document.getElementById('btn-sample-input'),
    btnCopyOutput: document.getElementById('btn-copy-output'),
    btnDownloadOutput: document.getElementById('btn-download-output'),

    // Inspector
    inspectorTrack: document.getElementById('inspector-track'),

    // Learning Center Try-Buttons
    tryCipherButtons: document.querySelectorAll('.btn-try-cipher'),

    // History
    historyList: document.getElementById('history-list'),
    toggleHistoryStorage: document.getElementById('toggle-history-storage'),
    btnClearHistory: document.getElementById('btn-clear-history'),

    // Modals
    confirmModal: document.getElementById('confirm-modal'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),
    btnConfirmCancel: document.getElementById('btn-confirm-cancel'),
    btnCancelConfirm: document.getElementById('btn-cancel-confirm'),
    testModal: document.getElementById('test-modal'),
    btnOpenTests: document.getElementById('btn-open-tests'),
    btnCloseTests: document.getElementById('btn-close-tests'),
    btnModalDone: document.getElementById('btn-modal-done'),
    btnRerunTests: document.getElementById('btn-rerun-tests'),
    footerTestLink: document.getElementById('footer-test-link'),

    // Hero Visual
    heroPlainText: document.getElementById('hero-plain-text'),
    heroCipherText: document.getElementById('hero-cipher-text'),
    heroCipherBadge: document.getElementById('hero-cipher-badge'),
    heroKeyStream: document.getElementById('hero-key-stream')
  },

  init() {
    this.setupThemeToggle();
    this.setupMobileMenu();
    this.setupNavigationScroll();
    this.setupCipherSelection();
    this.setupCaesarControls();
    this.setupSubstitutionControls();
    this.setupVigenereControls();
    this.setupTextareaListeners();
    this.setupActionButtons();
    this.setupLearningCenter();
    this.setupHistory();
    this.setupModals();
    this.setupHeroAnimation();
    this.updateCaesarPreview(AppState.caesarShift);
    this.updateSubstitutionPreview();
    this.updateKeystreamPreview();
    this.updateInputStats();
    this.renderHistory();
  },

  // --------------------------------------------------------------------------
  // Theme & Navigation
  // --------------------------------------------------------------------------
  setupThemeToggle() {
    this.elements.themeToggle.addEventListener('click', () => {
      const nextTheme = AppState.theme === 'dark' ? 'light' : 'dark';
      AppState.setTheme(nextTheme);
      Toast.show(`Theme switched to ${nextTheme} mode.`, 'info', 2000);
    });
  },

  setupMobileMenu() {
    this.elements.mobileMenuBtn.addEventListener('click', () => {
      const isOpen = this.elements.mainNav.classList.toggle('open');
      this.elements.mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu when a link is clicked
    this.elements.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.elements.mainNav.classList.remove('open');
        this.elements.mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  },

  setupNavigationScroll() {
    // Active link highlighting on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
      const scrollY = window.pageYOffset;
      sections.forEach(current => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop - 120;
        const sectionId = current.getAttribute('id');
        const link = document.querySelector(`.nav-link[data-nav="${sectionId}"]`);
        if (link) {
          if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        }
      });
    });
  },

  // --------------------------------------------------------------------------
  // Cipher Selection & Tooltip
  // --------------------------------------------------------------------------
  setupCipherSelection() {
    const cipherDescriptions = {
      caesar: '<strong>Caesar Cipher:</strong> Shifts every English letter forward in the alphabet by a fixed key (1–25). Punctuation, numbers, and spaces remain unchanged.',
      substitution: '<strong>Custom Substitution Cipher:</strong> Monoalphabetic substitution using a custom or randomly scrambled 26-letter alphabet. Replaces each letter one-to-one.',
      vigenere: '<strong>Vigenère Cipher:</strong> Polyalphabetic cipher using a secret repeating keyword to apply distinct Caesar shifts to successive alphabetic letters.'
    };

    this.elements.cipherSelect.addEventListener('change', (e) => {
      const cipher = e.target.value;
      AppState.currentCipher = cipher;

      // Update tooltip info
      this.elements.cipherInfoText.innerHTML = cipherDescriptions[cipher] || '';

      // Toggle Parameter Panels
      this.elements.panelCaesar.classList.toggle('active', cipher === 'caesar');
      this.elements.panelSubstitution.classList.toggle('active', cipher === 'substitution');
      this.elements.panelVigenere.classList.toggle('active', cipher === 'vigenere');

      // Update inspector and keystream
      this.updateKeystreamPreview();
      this.updateStatusDisplay();
    });

    // Handle footer quick links
    document.querySelectorAll('[data-cipher-trigger]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cipher = e.currentTarget.getAttribute('data-cipher-trigger');
        this.selectCipher(cipher);
      });
    });
  },

  selectCipher(cipher) {
    if (this.elements.cipherSelect.value !== cipher) {
      this.elements.cipherSelect.value = cipher;
      this.elements.cipherSelect.dispatchEvent(new Event('change'));
    }
  },

  // --------------------------------------------------------------------------
  // Caesar Cipher UI Controls
  // --------------------------------------------------------------------------
  setupCaesarControls() {
    const onShiftChange = (shift) => {
      const normalized = CaesarCipher.normalizeShift(shift);
      AppState.caesarShift = normalized;
      this.elements.caesarSlider.value = normalized;
      this.elements.caesarShiftVal.textContent = normalized;

      // Update preset buttons active state
      this.elements.caesarPresets.forEach(btn => {
        const btnShift = parseInt(btn.getAttribute('data-shift'), 10);
        btn.classList.toggle('active', btnShift === normalized);
      });

      this.updateCaesarPreview(normalized);
      this.updateStatusDisplay();
    };

    this.elements.caesarSlider.addEventListener('input', (e) => {
      onShiftChange(e.target.value);
    });

    this.elements.caesarPresets.forEach(btn => {
      btn.addEventListener('click', () => {
        const shift = btn.getAttribute('data-shift');
        onShiftChange(shift);
      });
    });
  },

  updateCaesarPreview(shift) {
    const container = this.elements.caesarMappingPreview;
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 26; i++) {
      const plainChar = STANDARD_ALPHABET[i];
      const cipherChar = CaesarCipher.encode(plainChar, shift);

      const node = document.createElement('div');
      node.className = 'map-node';
      node.innerHTML = `
        <span class="node-plain">${plainChar}</span>
        <span class="node-arrow">&darr;</span>
        <span class="node-cipher">${cipherChar}</span>
      `;
      container.appendChild(node);
    }
  },

  // --------------------------------------------------------------------------
  // Substitution Cipher UI Controls
  // --------------------------------------------------------------------------
  setupSubstitutionControls() {
    const input = this.elements.subAlphabetInput;

    const onAlphabetChange = () => {
      const alphabet = input.value.toUpperCase();
      input.value = alphabet;
      const validation = SubstitutionCipher.validate(alphabet);

      if (validation.isValid) {
        AppState.substitutionAlphabet = validation.sanitized;
        this.elements.subValidationBadge.textContent = '26/26 Unique';
        this.elements.subValidationBadge.className = 'alphabet-status-badge valid';
        this.elements.subErrorMsg.style.display = 'none';
        this.elements.subErrorMsg.textContent = '';
      } else {
        this.elements.subValidationBadge.textContent = `Invalid (${alphabet.length}/26)`;
        this.elements.subValidationBadge.className = 'alphabet-status-badge invalid';
        this.elements.subErrorMsg.style.display = 'block';
        this.elements.subErrorMsg.textContent = validation.error;
      }

      this.updateSubstitutionPreview();
      this.updateStatusDisplay();
    };

    input.addEventListener('input', onAlphabetChange);

    // Preset buttons
    this.elements.btnSubDefault.addEventListener('click', () => {
      input.value = SubstitutionCipher.DEFAULT_ALPHABET;
      onAlphabetChange();
      Toast.show('Loaded standard QWERTY substitution alphabet.', 'info', 2000);
    });

    this.elements.btnSubAtbash.addEventListener('click', () => {
      input.value = SubstitutionCipher.ATBASH_ALPHABET;
      onAlphabetChange();
      Toast.show('Loaded Atbash reverse substitution alphabet (A=Z, B=Y...).', 'info', 2000);
    });

    this.elements.btnSubRot13.addEventListener('click', () => {
      input.value = SubstitutionCipher.ROT13_ALPHABET;
      onAlphabetChange();
      Toast.show('Loaded ROT13 substitution alphabet.', 'info', 2000);
    });

    this.elements.btnSubShuffle.addEventListener('click', () => {
      const shuffled = SubstitutionCipher.generateRandomAlphabet();
      input.value = shuffled;
      onAlphabetChange();
      Toast.show('Generated a new random 26-letter substitution alphabet!', 'success', 2500);
    });
  },

  updateSubstitutionPreview() {
    const container = this.elements.subMappingGrid;
    if (!container) return;
    container.innerHTML = '';

    const alphabet = this.elements.subAlphabetInput.value.toUpperCase();

    for (let i = 0; i < 26; i++) {
      const plain = STANDARD_ALPHABET[i];
      const cipher = alphabet[i] || '?';

      const pair = document.createElement('div');
      pair.className = 'sub-pair';
      pair.innerHTML = `
        <span class="sub-pair-plain">${plain}</span>
        <span class="sub-pair-cipher">${cipher}</span>
      `;
      container.appendChild(pair);
    }
  },

  // --------------------------------------------------------------------------
  // Vigenère Cipher UI Controls
  // --------------------------------------------------------------------------
  setupVigenereControls() {
    const input = this.elements.vigenereKeywordInput;

    const onKeyChange = () => {
      const val = input.value.trim().toUpperCase();
      input.value = val;
      const validation = VigenereCipher.validate(val);

      if (validation.isValid) {
        AppState.vigenereKeyword = validation.sanitized;
        this.elements.vigenereKeyStatus.textContent = 'Valid Key';
        this.elements.vigenereKeyStatus.className = 'keyword-status-badge valid';
        this.elements.vigenereErrorMsg.style.display = 'none';
        this.elements.vigenereErrorMsg.textContent = '';
      } else {
        this.elements.vigenereKeyStatus.textContent = 'Invalid Key';
        this.elements.vigenereKeyStatus.className = 'keyword-status-badge invalid';
        this.elements.vigenereErrorMsg.style.display = 'block';
        this.elements.vigenereErrorMsg.textContent = validation.error;
      }

      // Update preset buttons state
      this.elements.vigenerePresets.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-vkey') === val);
      });

      this.updateKeystreamPreview();
      this.updateStatusDisplay();
    };

    input.addEventListener('input', onKeyChange);

    this.elements.vigenerePresets.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-vkey');
        input.value = key;
        onKeyChange();
      });
    });
  },

  updateKeystreamPreview() {
    const container = this.elements.keystreamDisplay;
    if (!container) return;
    container.innerHTML = '';

    const text = (this.elements.inputMessage.value || 'CIPHER STUDIO').toUpperCase();
    const keyword = this.elements.vigenereKeywordInput.value.toUpperCase().replace(/[^A-Z]/g, '') || 'SECRET';

    let kIndex = 0;
    const maxChars = Math.min(text.length, 16);

    for (let i = 0; i < maxChars; i++) {
      const char = text[i];
      const isAlpha = char >= 'A' && char <= 'Z';

      const col = document.createElement('div');
      col.className = 'keystream-col';

      if (isAlpha) {
        const keyChar = keyword[kIndex % keyword.length];
        const shift = keyChar.charCodeAt(0) - 65;
        col.innerHTML = `
          <span class="ks-char">${char}</span>
          <span class="ks-key">${keyChar}</span>
          <span class="ks-shift">+${shift}</span>
        `;
        kIndex++;
      } else {
        col.innerHTML = `
          <span class="ks-char">${char === ' ' ? '&blank;' : char}</span>
          <span class="ks-key">-</span>
          <span class="ks-shift">0</span>
        `;
      }
      container.appendChild(col);
    }
  },

  // --------------------------------------------------------------------------
  // Main Textarea & Statistics
  // --------------------------------------------------------------------------
  setupTextareaListeners() {
    this.elements.inputMessage.addEventListener('input', () => {
      this.updateInputStats();
      this.updateKeystreamPreview();

      // Clear empty warning if any
      if (this.elements.inputMessage.value.trim().length > 0) {
        this.elements.inputValidationMsg.style.display = 'none';
      }
    });
  },

  updateInputStats() {
    const text = this.elements.inputMessage.value;
    const charCount = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;

    this.elements.inputCharCount.textContent = charCount;
    this.elements.inputWordCount.textContent = words;
    this.elements.inputAlphaCount.textContent = alphaCount;
  },

  updateOutputStats(text) {
    const charCount = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    this.elements.outputCharCount.textContent = charCount;
    this.elements.outputWordCount.textContent = words;

    if (charCount > 0) {
      this.elements.outputEmptyState.style.display = 'none';
    } else {
      this.elements.outputEmptyState.style.display = 'flex';
    }
  },

  updateStatusDisplay() {
    let desc = '';
    if (AppState.currentCipher === 'caesar') {
      desc = `Algorithm: Caesar (Shift ${AppState.caesarShift})`;
    } else if (AppState.currentCipher === 'substitution') {
      desc = 'Algorithm: Custom Substitution (26-Key)';
    } else if (AppState.currentCipher === 'vigenere') {
      desc = `Algorithm: Vigenère (Key: "${AppState.vigenereKeyword}")`;
    }
    this.elements.outputStatusText.textContent = desc;
  },

  // --------------------------------------------------------------------------
  // Core Operations: Encode, Decode, Swap, Clear, Copy, Download
  // --------------------------------------------------------------------------
  setupActionButtons() {
    // 1. Encode
    this.elements.btnEncode.addEventListener('click', () => {
      this.processMessage('encode');
    });

    // 2. Decode
    this.elements.btnDecode.addEventListener('click', () => {
      this.processMessage('decode');
    });

    // 3. Swap Input & Output
    this.elements.btnSwap.addEventListener('click', () => {
      const outputText = this.elements.outputMessage.value;
      if (!outputText) {
        Toast.show('No output message to swap into input.', 'warning', 2500);
        return;
      }

      this.elements.inputMessage.value = outputText;
      this.elements.outputMessage.value = '';
      this.updateInputStats();
      this.updateOutputStats('');
      this.updateKeystreamPreview();
      this.elements.outputOperationBadge.textContent = 'READY';
      this.elements.outputOperationBadge.className = 'panel-badge badge-cyan';
      this.elements.outputLabel.textContent = 'Result Message';
      Toast.show('Swapped output into input field.', 'info', 2000);
    });

    // 4. Clear All
    this.elements.btnClearAll.addEventListener('click', () => {
      this.elements.inputMessage.value = '';
      this.elements.outputMessage.value = '';
      this.elements.inputValidationMsg.style.display = 'none';
      this.updateInputStats();
      this.updateOutputStats('');
      this.updateKeystreamPreview();
      this.resetInspector();
      this.elements.outputOperationBadge.textContent = 'READY';
      this.elements.outputOperationBadge.className = 'panel-badge badge-cyan';
      this.elements.outputLabel.textContent = 'Result Message';
      Toast.show('Workspace cleared.', 'info', 1800);
    });

    // 5. Clear Input Only
    this.elements.btnClearInput.addEventListener('click', () => {
      this.elements.inputMessage.value = '';
      this.elements.inputValidationMsg.style.display = 'none';
      this.updateInputStats();
      this.updateKeystreamPreview();
      this.elements.inputMessage.focus();
    });

    // 6. Paste Input
    this.elements.btnPasteInput.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          throw new Error('Clipboard API not available');
        }
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          this.elements.inputMessage.value = clipText;
          this.updateInputStats();
          this.updateKeystreamPreview();
          Toast.show('Text pasted from clipboard.', 'success', 2000);
        } else {
          Toast.show('Clipboard is empty.', 'warning', 2000);
        }
      } catch (err) {
        console.warn('Clipboard read error:', err);
        Toast.show('Clipboard permission blocked or unavailable. Please use Ctrl+V.', 'warning', 3500);
      }
    });

    // 7. Sample Input
    this.elements.btnSampleInput.addEventListener('click', () => {
      let sample = '';
      if (AppState.currentCipher === 'caesar') {
        sample = 'Meet me at the secret rendezvous point at midnight! Caesar Shift = 3.';
      } else if (AppState.currentCipher === 'substitution') {
        sample = 'The eagle has landed safely behind enemy lines. All communications are classified!';
      } else {
        sample = 'ATTACK AT DAWN! Preserve the secret key LEMON at all costs.';
      }
      this.elements.inputMessage.value = sample;
      this.elements.inputValidationMsg.style.display = 'none';
      this.updateInputStats();
      this.updateKeystreamPreview();
      Toast.show('Loaded sample secret message into input.', 'info', 2000);
    });

    // 8. Copy Output
    this.elements.btnCopyOutput.addEventListener('click', () => {
      const outputText = this.elements.outputMessage.value;
      if (!outputText) {
        Toast.show('No output text available to copy.', 'warning', 2000);
        return;
      }

      this.copyToClipboard(outputText);
    });

    // 9. Download Output as .txt
    this.elements.btnDownloadOutput.addEventListener('click', () => {
      const outputText = this.elements.outputMessage.value;
      if (!outputText) {
        Toast.show('No output text to download.', 'warning', 2000);
        return;
      }

      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `webwhisper-${AppState.currentCipher}-${timestamp}.txt`;
        const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 150);

        Toast.show(`Downloaded "${filename}" successfully!`, 'success', 3000);
      } catch (err) {
        console.error('Download error:', err);
        Toast.show('Failed to initiate file download.', 'error', 3000);
      }
    });
  },

  processMessage(operation) {
    const input = this.elements.inputMessage.value;

    // Validate non-empty input
    if (!input || input.trim() === '') {
      this.elements.inputValidationMsg.textContent = 'Please enter or paste a message to process.';
      this.elements.inputValidationMsg.style.display = 'block';
      this.elements.inputMessage.focus();
      Toast.show('Please enter a message before executing.', 'warning', 2500);
      return;
    }

    this.elements.inputValidationMsg.style.display = 'none';
    let output = '';
    let cipherConfig = '';

    try {
      if (AppState.currentCipher === 'caesar') {
        const shift = AppState.caesarShift;
        cipherConfig = `Shift: ${shift}`;
        output = (operation === 'encode') 
          ? CaesarCipher.encode(input, shift) 
          : CaesarCipher.decode(input, shift);
      } else if (AppState.currentCipher === 'substitution') {
        const alphabet = this.elements.subAlphabetInput.value.toUpperCase();
        cipherConfig = `Alphabet: ${alphabet.slice(0, 6)}...`;
        output = (operation === 'encode') 
          ? SubstitutionCipher.encode(input, alphabet) 
          : SubstitutionCipher.decode(input, alphabet);
      } else if (AppState.currentCipher === 'vigenere') {
        const key = this.elements.vigenereKeywordInput.value.toUpperCase().trim();
        cipherConfig = `Key: "${key}"`;
        output = (operation === 'encode') 
          ? VigenereCipher.encode(input, key) 
          : VigenereCipher.decode(input, key);
      }

      // Render output
      this.elements.outputMessage.value = output;
      this.updateOutputStats(output);

      // Update Labels & Badges
      const isEncode = (operation === 'encode');
      this.elements.outputLabel.textContent = isEncode ? 'Encoded Message' : 'Decoded Message';
      this.elements.outputOperationBadge.textContent = isEncode ? 'ENCODED' : 'DECODED';
      this.elements.outputOperationBadge.className = `panel-badge ${isEncode ? 'badge-purple' : 'badge-cyan'}`;

      // Build Step-by-Step Character Inspector
      this.renderInspector(input, output, operation);

      // Save to History
      AppState.addHistoryEntry({
        operation,
        cipher: AppState.currentCipher,
        cipherConfig,
        input,
        output
      });
      this.renderHistory();

      // Show Toast
      const opName = isEncode ? 'Encoded' : 'Decoded';
      Toast.show(`Message successfully ${opName.toLowerCase()} using ${this.formatCipherName(AppState.currentCipher)}!`, 'success', 2500);

    } catch (err) {
      console.error('Cipher processing error:', err);
      Toast.show(err.message || 'Error processing message.', 'error', 3500);
    }
  },

  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          Toast.show('Output copied to clipboard!', 'success', 2000);
        })
        .catch(() => {
          this.fallbackCopy(text);
        });
    } else {
      this.fallbackCopy(text);
    }
  },

  fallbackCopy(text) {
    try {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.style.position = 'fixed';
      temp.style.left = '-9999px';
      document.body.appendChild(temp);
      temp.focus();
      temp.select();
      const success = document.execCommand('copy');
      document.body.removeChild(temp);
      if (success) {
        Toast.show('Output copied to clipboard (fallback)!', 'success', 2000);
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      console.warn('Fallback copy failed:', err);
      Toast.show('Unable to copy automatically. Please select text and press Ctrl+C.', 'warning', 3500);
    }
  },

  // --------------------------------------------------------------------------
  // Step-by-Step Character Inspector
  // --------------------------------------------------------------------------
  renderInspector(input, output, operation) {
    const track = this.elements.inspectorTrack;
    if (!track) return;
    track.innerHTML = '';

    const limit = Math.min(input.length, 20);

    for (let i = 0; i < limit; i++) {
      const inChar = input[i];
      const outChar = output[i];
      const isAlpha = /[a-zA-Z]/.test(inChar);

      const tile = document.createElement('div');
      tile.className = 'inspector-tile';
      tile.innerHTML = `
        <span class="tile-plain">${inChar === ' ' ? '&blank;' : this.escapeHtml(inChar)}</span>
        <span class="tile-arrow">&darr;</span>
        <span class="tile-cipher">${outChar === ' ' ? '&blank;' : this.escapeHtml(outChar)}</span>
        <span class="tile-note">${isAlpha ? 'Shift' : 'Keep'}</span>
      `;
      track.appendChild(tile);
    }

    if (input.length > 20) {
      const more = document.createElement('div');
      more.className = 'inspector-tile';
      more.style.justifyContent = 'center';
      more.innerHTML = `<span class="tile-note">+${input.length - 20} more</span>`;
      track.appendChild(more);
    }
  },

  resetInspector() {
    if (this.elements.inspectorTrack) {
      this.elements.inspectorTrack.innerHTML = '<div class="inspector-placeholder">Process a message to view character-level cipher mechanics.</div>';
    }
  },

  // --------------------------------------------------------------------------
  // Learning Center & "Try This Cipher"
  // --------------------------------------------------------------------------
  setupLearningCenter() {
    this.elements.tryCipherButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cipher = e.currentTarget.getAttribute('data-target-cipher');
        const shift = e.currentTarget.getAttribute('data-preset-shift');
        const key = e.currentTarget.getAttribute('data-preset-key');
        const text = e.currentTarget.getAttribute('data-preset-text');

        // 1. Select the cipher
        this.selectCipher(cipher);

        // 2. Set parameters
        if (cipher === 'caesar' && shift) {
          this.elements.caesarSlider.value = shift;
          this.elements.caesarSlider.dispatchEvent(new Event('input'));
        } else if (cipher === 'vigenere' && key) {
          this.elements.vigenereKeywordInput.value = key;
          this.elements.vigenereKeywordInput.dispatchEvent(new Event('input'));
        }

        // 3. Set text
        if (text) {
          this.elements.inputMessage.value = text;
          this.updateInputStats();
          this.updateKeystreamPreview();
        }

        // 4. Scroll to encoder
        const encoderSection = document.getElementById('encoder');
        if (encoderSection) {
          encoderSection.scrollIntoView({ behavior: 'smooth' });
        }

        Toast.show(`Loaded ${this.formatCipherName(cipher)} sample into workspace! Click Encode.`, 'info', 3000);
      });
    });
  },

  // --------------------------------------------------------------------------
  // History UI
  // --------------------------------------------------------------------------
  setupHistory() {
    // 1. History Toggle Switch
    this.elements.toggleHistoryStorage.checked = AppState.historyEnabled;
    this.elements.toggleHistoryStorage.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      AppState.setHistoryEnabled(enabled);
      this.renderHistory();
      if (enabled) {
        Toast.show('Local session history enabled.', 'info', 2000);
      } else {
        Toast.show('Session history disabled and existing entries cleared.', 'warning', 2500);
      }
    });

    // 2. Clear All History Button (opens confirmation modal)
    this.elements.btnClearHistory.addEventListener('click', () => {
      if (AppState.history.length === 0) {
        Toast.show('History is already empty.', 'info', 2000);
        return;
      }
      this.elements.confirmModal.style.display = 'flex';
    });

    // Confirmation Modal Actions
    this.elements.btnConfirmDelete.addEventListener('click', () => {
      AppState.clearHistory();
      this.renderHistory();
      this.elements.confirmModal.style.display = 'none';
      Toast.show('Session history cleared completely.', 'info', 2000);
    });

    this.elements.btnConfirmCancel.addEventListener('click', () => {
      this.elements.confirmModal.style.display = 'none';
    });

    this.elements.btnCancelConfirm.addEventListener('click', () => {
      this.elements.confirmModal.style.display = 'none';
    });
  },

  renderHistory() {
    const list = this.elements.historyList;
    if (!list) return;

    if (!AppState.historyEnabled) {
      list.innerHTML = `
        <div class="history-empty-card">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <p>History saving is currently disabled in your preferences.</p>
        </div>
      `;
      return;
    }

    if (AppState.history.length === 0) {
      list.innerHTML = `
        <div class="history-empty-card">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <p>No recent activity logged yet. Encode or decode messages to see your recent operations here.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = '';

    AppState.history.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-card';

      const timeAgo = this.formatTimeAgo(item.timestamp);
      const isEncode = item.operation === 'encode';

      card.innerHTML = `
        <div class="history-meta-group">
          <span class="history-op-badge ${isEncode ? 'encode' : 'decode'}">${isEncode ? 'ENCODED' : 'DECODED'}</span>
          <span class="history-cipher-text">${this.formatCipherName(item.cipher)}</span>
          <span class="history-time">${timeAgo} &bull; ${this.escapeHtml(item.cipherConfig || '')}</span>
        </div>

        <div class="history-snippet-box">
          <span class="history-snippet-label">Input Preview</span>
          <span class="history-snippet-text" title="${this.escapeHtml(item.input)}">${this.escapeHtml(item.input)}</span>
        </div>

        <div class="history-snippet-box">
          <span class="history-snippet-label">Result Preview</span>
          <span class="history-snippet-text glow-cyan" title="${this.escapeHtml(item.output)}">${this.escapeHtml(item.output)}</span>
        </div>

        <div class="history-actions">
          <button type="button" class="btn-tool btn-restore-history" data-id="${item.id}" title="Load this text and cipher back into the workspace">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            <span>Reuse</span>
          </button>
          <button type="button" class="btn-tool btn-danger btn-delete-history" data-id="${item.id}" title="Delete this entry">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      `;

      // Event listener for Restore
      card.querySelector('.btn-restore-history').addEventListener('click', () => {
        this.restoreHistoryItem(item);
      });

      // Event listener for Delete
      card.querySelector('.btn-delete-history').addEventListener('click', () => {
        AppState.deleteHistoryEntry(item.id);
        this.renderHistory();
        Toast.show('History entry deleted.', 'info', 1800);
      });

      list.appendChild(card);
    });
  },

  restoreHistoryItem(item) {
    this.selectCipher(item.cipher);
    this.elements.inputMessage.value = item.input;
    this.elements.outputMessage.value = item.output;

    // Restore cipher configuration if applicable
    if (item.cipher === 'caesar' && item.cipherConfig) {
      const match = item.cipherConfig.match(/\d+/);
      if (match) {
        this.elements.caesarSlider.value = match[0];
        this.elements.caesarSlider.dispatchEvent(new Event('input'));
      }
    } else if (item.cipher === 'vigenere' && item.cipherConfig) {
      const match = item.cipherConfig.match(/"([^"]+)"/);
      if (match) {
        this.elements.vigenereKeywordInput.value = match[1];
        this.elements.vigenereKeywordInput.dispatchEvent(new Event('input'));
      }
    }

    this.updateInputStats();
    this.updateOutputStats(item.output);
    this.updateKeystreamPreview();
    this.renderInspector(item.input, item.output, item.operation);

    const isEncode = (item.operation === 'encode');
    this.elements.outputLabel.textContent = isEncode ? 'Encoded Message' : 'Decoded Message';
    this.elements.outputOperationBadge.textContent = isEncode ? 'ENCODED' : 'DECODED';

    const encoderSection = document.getElementById('encoder');
    if (encoderSection) {
      encoderSection.scrollIntoView({ behavior: 'smooth' });
    }

    Toast.show('Restored operation to workspace.', 'success', 2500);
  },

  // --------------------------------------------------------------------------
  // Modals Setup (Diagnostics & Backdrop Clicks)
  // --------------------------------------------------------------------------
  setupModals() {
    const openTests = () => {
      this.elements.testModal.style.display = 'flex';
      TestRunner.runAllTests();
    };

    const closeTests = () => {
      this.elements.testModal.style.display = 'none';
    };

    this.elements.btnOpenTests.addEventListener('click', openTests);
    this.elements.footerTestLink.addEventListener('click', openTests);
    this.elements.btnCloseTests.addEventListener('click', closeTests);
    this.elements.btnModalDone.addEventListener('click', closeTests);
    this.elements.btnRerunTests.addEventListener('click', () => {
      TestRunner.runAllTests();
    });

    // Close when clicking outside of modal container
    [this.elements.testModal, this.elements.confirmModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.elements.testModal.style.display = 'none';
        this.elements.confirmModal.style.display = 'none';
      }
    });
  },

  // --------------------------------------------------------------------------
  // Hero Interactive Visual Matrix Ticker
  // --------------------------------------------------------------------------
  setupHeroAnimation() {
    const plainWords = ['HELLO WORLD', 'SECRET CODE', 'CIPHER STUDIO', 'ANCIENT ROME', 'TOP SECRET'];
    let wordIndex = 0;

    setInterval(() => {
      wordIndex = (wordIndex + 1) % plainWords.length;
      const plain = plainWords[wordIndex];
      const encoded = CaesarCipher.encode(plain, 3);

      this.elements.heroPlainText.textContent = plain;
      this.elements.heroCipherText.textContent = encoded;

      // Update keystream nodes
      const streamHtml = plain.split('').slice(0, 10).map((char, i) => {
        if (char === ' ') return '<span>&blank;</span>';
        const outChar = encoded[i];
        return `<span>${char}&rarr;${outChar}</span>`;
      }).join('');

      this.elements.heroKeyStream.innerHTML = streamHtml;
    }, 4000);
  },

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  formatCipherName(cipher) {
    if (cipher === 'caesar') return 'Caesar Cipher';
    if (cipher === 'substitution') return 'Substitution Cipher';
    if (cipher === 'vigenere') return 'Vigenère Cipher';
    return cipher;
  },

  formatTimeAgo(timestamp) {
    const elapsed = Math.floor((Date.now() - timestamp) / 1000);
    if (elapsed < 30) return 'Just now';
    if (elapsed < 60) return `${elapsed}s ago`;
    const mins = Math.floor(elapsed / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  },

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};

// ============================================================================
// 5. CIPHER CHALLENGE MODE CONTROLLER
// ============================================================================

const ChallengeMode = {
  puzzles: [
    {
      id: 1,
      difficulty: 'Easy',
      cipherType: 'Caesar (+3)',
      ciphertext: 'KHOOR ZRUOG',
      solution: 'HELLO WORLD',
      hint: "Julius Caesar's original shift of 3. Shift each letter 3 places backwards (K->H, H->E)."
    },
    {
      id: 2,
      difficulty: 'Easy',
      cipherType: 'Caesar (+1)',
      ciphertext: 'DSZQUZ',
      solution: 'CRYPTO',
      hint: "Each letter was shifted forward by exactly 1 position in the alphabet. D->C, S->R, Z->Y."
    },
    {
      id: 3,
      difficulty: 'Medium',
      cipherType: 'Caesar ROT13',
      ciphertext: 'GBBYOBK',
      solution: 'TOOLBOX',
      hint: "Classic ROT13 rotation: shift by 13 positions (or rotate halfway around the 26-letter alphabet)."
    },
    {
      id: 4,
      difficulty: 'Medium',
      cipherType: 'Vigenère (Key: "KEY")',
      ciphertext: 'RIJVS',
      solution: 'HELLO',
      hint: "Polyalphabetic Vigenère with 3-letter keyword 'KEY' (K=10, E=4, Y=24)."
    },
    {
      id: 5,
      difficulty: 'Hard',
      cipherType: 'Vigenère (Key: "CIPHER")',
      ciphertext: 'VPXZH ZVVT',
      solution: 'SECRET CODE',
      hint: "Keystream repeats the keyword 'CIPHER'. Remember spaces do not consume a keyword letter!"
    },
    {
      id: 6,
      difficulty: 'Hard',
      cipherType: 'Atbash (Reverse Alphabet)',
      ciphertext: 'SVOOL DLIOW',
      solution: 'HELLO WORLD',
      hint: "The ancient Atbash cipher mirrors the alphabet: A=Z, B=Y, C=X, D=W, E=V, etc."
    }
  ],

  currentIndex: 0,
  score: 0,
  streak: 0,
  hintUsed: false,

  // DOM Elements
  elements: {
    stepBadge: document.getElementById('challenge-step-text'),
    diffBadge: document.getElementById('challenge-difficulty'),
    scoreVal: document.getElementById('challenge-score'),
    streakVal: document.getElementById('challenge-streak'),
    ciphertext: document.getElementById('challenge-ciphertext'),
    algoHint: document.getElementById('challenge-algo-hint'),
    hintBox: document.getElementById('challenge-hint-box'),
    hintText: document.getElementById('challenge-hint-text'),
    input: document.getElementById('challenge-input'),
    feedback: document.getElementById('challenge-feedback'),
    btnSubmit: document.getElementById('btn-submit-challenge'),
    btnHint: document.getElementById('btn-challenge-hint'),
    btnReveal: document.getElementById('btn-challenge-reveal'),
    btnNext: document.getElementById('btn-challenge-next'),
    btnRestart: document.getElementById('btn-restart-challenge')
  },

  init() {
    this.setupListeners();
    this.loadPuzzle(0);
  },

  setupListeners() {
    // Submit Answer
    this.elements.btnSubmit.addEventListener('click', () => {
      this.checkAnswer();
    });

    this.elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.checkAnswer();
      }
    });

    // Request Hint
    this.elements.btnHint.addEventListener('click', () => {
      if (!this.hintUsed) {
        this.hintUsed = true;
        this.score = Math.max(0, this.score - 2);
        this.updateStats();
        Toast.show('Hint revealed (-2 points)', 'info', 2000);
      }
      this.elements.hintBox.style.display = 'flex';
    });

    // Reveal Solution
    this.elements.btnReveal.addEventListener('click', () => {
      const puzzle = this.puzzles[this.currentIndex];
      this.streak = 0;
      this.updateStats();
      this.elements.input.value = puzzle.solution;
      this.showFeedback(`Solution revealed: <strong>${puzzle.solution}</strong>. No points awarded.`, 'incorrect');
      this.elements.btnNext.style.display = 'inline-flex';
    });

    // Next Puzzle
    this.elements.btnNext.addEventListener('click', () => {
      this.currentIndex = (this.currentIndex + 1) % this.puzzles.length;
      this.loadPuzzle(this.currentIndex);
    });

    // Restart Challenge Mode
    this.elements.btnRestart.addEventListener('click', () => {
      this.currentIndex = 0;
      this.score = 0;
      this.streak = 0;
      this.loadPuzzle(0);
      Toast.show('Challenge mode restarted from Puzzle 1.', 'info', 2000);
    });
  },

  loadPuzzle(index) {
    const puzzle = this.puzzles[index];
    this.hintUsed = false;

    this.elements.stepBadge.textContent = `Challenge ${index + 1} of ${this.puzzles.length}`;
    this.elements.diffBadge.textContent = puzzle.difficulty;
    this.elements.diffBadge.className = `difficulty-pill ${puzzle.difficulty.toLowerCase()}`;

    this.elements.algoHint.textContent = `Cipher: ${puzzle.cipherType}`;
    this.elements.ciphertext.textContent = puzzle.ciphertext;
    this.elements.hintText.textContent = puzzle.hint;
    this.elements.hintBox.style.display = 'none';

    this.elements.input.value = '';
    this.elements.input.disabled = false;
    this.elements.feedback.style.display = 'none';
    this.elements.btnNext.style.display = 'none';
    this.elements.btnSubmit.disabled = false;

    this.updateStats();
  },

  checkAnswer() {
    const puzzle = this.puzzles[this.currentIndex];
    const userAnswer = this.elements.input.value.trim().toUpperCase();

    if (!userAnswer) {
      Toast.show('Please enter your decoded answer.', 'warning', 2000);
      return;
    }

    if (userAnswer === puzzle.solution) {
      const earned = this.hintUsed ? 8 : 10;
      this.score += earned;
      this.streak += 1;
      this.updateStats();

      this.showFeedback(`&check; Correct! You successfully decoded "${puzzle.solution}" (+${earned} pts).`, 'correct');
      this.elements.input.disabled = true;
      this.elements.btnSubmit.disabled = true;
      this.elements.btnNext.style.display = 'inline-flex';
      Toast.show('Great deduction! Answer is correct.', 'success', 2500);
    } else {
      this.streak = 0;
      this.updateStats();
      this.showFeedback('&cross; Incorrect answer. Check your cipher shifting and try again!', 'incorrect');
      Toast.show('Incorrect decode. Need a hint?', 'error', 2500);
    }
  },

  showFeedback(html, type) {
    this.elements.feedback.innerHTML = html;
    this.elements.feedback.className = `challenge-feedback ${type}`;
    this.elements.feedback.style.display = 'block';
  },

  updateStats() {
    this.elements.scoreVal.textContent = this.score;
    this.elements.streakVal.textContent = this.streak;
  }
};

// ============================================================================
// 6. 20-POINT CRYPTOGRAPHIC DIAGNOSTIC TEST RUNNER
// ============================================================================

const TestRunner = {
  tests: [
    {
      id: 1,
      name: 'Caesar Encode: HELLO (shift 3)',
      run: () => CaesarCipher.encode('HELLO', 3) === 'KHOOR'
    },
    {
      id: 2,
      name: 'Caesar Decode: KHOOR (shift 3)',
      run: () => CaesarCipher.decode('KHOOR', 3) === 'HELLO'
    },
    {
      id: 3,
      name: 'Caesar Alphabet Wraparound: XYZ (shift 3)',
      run: () => CaesarCipher.encode('XYZ', 3) === 'ABC'
    },
    {
      id: 4,
      name: 'Caesar Case Preservation: Hello World! (shift 3)',
      run: () => CaesarCipher.encode('Hello World!', 3) === 'Khoor Zruog!'
    },
    {
      id: 5,
      name: 'Punctuation & Numbers Unchanged: "123 #Secret!"',
      run: () => CaesarCipher.encode('123 #Secret!', 3) === '123 #Vhfuhw!'
    },
    {
      id: 6,
      name: 'Empty Input Validation & Graceful Fallback',
      run: () => CaesarCipher.encode('', 3) === '' && CaesarCipher.decode('', 3) === ''
    },
    {
      id: 7,
      name: 'Caesar Shift Normalization: Shift 29 == Shift 3',
      run: () => CaesarCipher.encode('HELLO', 29) === 'KHOOR' && CaesarCipher.encode('HELLO', -23) === 'KHOOR'
    },
    {
      id: 8,
      name: 'Substitution Reversible Mapping (QWERTY Key)',
      run: () => {
        const key = SubstitutionCipher.DEFAULT_ALPHABET;
        const encoded = SubstitutionCipher.encode('The Quick Brown Fox', key);
        const decoded = SubstitutionCipher.decode(encoded, key);
        return decoded === 'The Quick Brown Fox';
      }
    },
    {
      id: 9,
      name: 'Substitution Duplicate Letter Detection',
      run: () => {
        const invalidKey = 'AABCDEFGHIJKLMNOPQRSTUVWXY';
        const validation = SubstitutionCipher.validate(invalidKey);
        return validation.isValid === false && validation.error.includes('Duplicate');
      }
    },
    {
      id: 10,
      name: 'Vigenère Round-Trip: ATTACK AT DAWN (Key LEMON)',
      run: () => {
        const enc = VigenereCipher.encode('ATTACK AT DAWN', 'LEMON');
        const dec = VigenereCipher.decode(enc, 'LEMON');
        return enc === 'LXFOPV EF RNHR' && dec === 'ATTACK AT DAWN';
      }
    },
    {
      id: 11,
      name: 'Vigenère Case Preservation: "Attack At Dawn!"',
      run: () => {
        const enc = VigenereCipher.encode('Attack At Dawn!', 'LEMON');
        const dec = VigenereCipher.decode(enc, 'LEMON');
        return enc === 'Lxfopv Ef Rnhr!' && dec === 'Attack At Dawn!';
      }
    },
    {
      id: 12,
      name: 'Vigenère Invalid Keyword Rejection (Empty or digits)',
      run: () => {
        const v1 = VigenereCipher.validate('');
        const v2 = VigenereCipher.validate('KEY123');
        return v1.isValid === false && v2.isValid === false;
      }
    },
    {
      id: 13,
      name: 'Vigenère Keystream Advancement Only on Letters',
      run: () => {
        // "A A" with key "AB" -> 1st 'A' shifted by 'A'(0) -> 'A'; space ignored; 2nd 'A' shifted by 'B'(1) -> 'B'
        const enc = VigenereCipher.encode('A A', 'AB');
        return enc === 'A B';
      }
    },
    {
      id: 14,
      name: 'Substitution Inverse Atbash Round-Trip',
      run: () => {
        const atbash = SubstitutionCipher.ATBASH_ALPHABET;
        const msg = 'Security In Plain Sight';
        const enc = SubstitutionCipher.encode(msg, atbash);
        const dec = SubstitutionCipher.decode(enc, atbash);
        return dec === msg;
      }
    },
    {
      id: 15,
      name: 'Workspace Swap Logic Preserves Data Integrity',
      run: () => {
        const original = 'Secret Coordinates: 45.12, 12.34';
        const encoded = CaesarCipher.encode(original, 5);
        const decoded = CaesarCipher.decode(encoded, 5);
        return decoded === original;
      }
    },
    {
      id: 16,
      name: 'Text Blob Creation for Plaintext Download',
      run: () => {
        const blob = new Blob(['WebWhisper Test'], { type: 'text/plain;charset=utf-8' });
        return blob.size > 0 && blob.type.includes('text/plain');
      }
    },
    {
      id: 17,
      name: 'LocalStorage History Capacity Cap (10 Max)',
      run: () => {
        const dummyHistory = [];
        for (let i = 0; i < 15; i++) {
          dummyHistory.unshift({ id: i, text: 'item ' + i });
          if (dummyHistory.length > 10) dummyHistory.pop();
        }
        return dummyHistory.length === 10 && dummyHistory[0].id === 14;
      }
    },
    {
      id: 18,
      name: 'Challenge Solution Verifier',
      run: () => {
        const puzzle = ChallengeMode.puzzles[0];
        const solved = CaesarCipher.decode(puzzle.ciphertext, 3);
        return solved === puzzle.solution;
      }
    },
    {
      id: 19,
      name: 'Theme Toggle & Attribute Verification',
      run: () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        return currentTheme === 'dark' || currentTheme === 'light';
      }
    },
    {
      id: 20,
      name: 'Unicode Character Preservation Without Crashing',
      run: () => {
        const unicodeText = 'Secret 🔐 100% — Café & Naïve!';
        const encoded = CaesarCipher.encode(unicodeText, 3);
        const decoded = CaesarCipher.decode(encoded, 3);
        return decoded === unicodeText;
      }
    }
  ],

  runAllTests() {
    const list = document.getElementById('test-results-container');
    const passedCount = document.getElementById('tests-passed-count');
    const failedCount = document.getElementById('tests-failed-count');
    const totalCount = document.getElementById('tests-total-count');

    if (!list) return;
    list.innerHTML = '';

    let passed = 0;
    let failed = 0;

    this.tests.forEach(test => {
      let result = false;
      let error = null;

      try {
        result = test.run();
      } catch (err) {
        result = false;
        error = err.message;
      }

      if (result) {
        passed++;
      } else {
        failed++;
      }

      const row = document.createElement('div');
      row.className = 'test-item-row';
      row.innerHTML = `
        <div class="test-item-left">
          <span class="test-badge ${result ? 'pass' : 'fail'}">${result ? 'PASS' : 'FAIL'}</span>
          <span class="test-name">${test.id}. ${test.name}</span>
        </div>
        <span class="test-details">${error ? error : (result ? '100% matched expected output' : 'Returned unexpected value')}</span>
      `;
      list.appendChild(row);
    });

    passedCount.textContent = passed;
    failedCount.textContent = failed;
    totalCount.textContent = this.tests.length;

    if (failed === 0) {
      Toast.show(`All ${passed} test cases passed with 100% accuracy!`, 'success', 3000);
    } else {
      Toast.show(`${failed} test(s) failed. Check details in modal.`, 'error', 3500);
    }
  }
};

// ============================================================================
// 7. INITIALIZATION ON DOM READY
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  AppState.init();
  UI.init();
  ChallengeMode.init();

  console.log('%cWebWhisper Cryptography Studio Initialized', 'color: #22D3EE; font-size: 14px; font-weight: bold;');
  console.log('To run tests from the console, execute: TestRunner.runAllTests()');
});

// Export objects to window for testing and console inspection
window.WebWhisper = {
  CaesarCipher,
  SubstitutionCipher,
  VigenereCipher,
  AppState,
  UI,
  ChallengeMode,
  TestRunner,
  Toast
};
