/**
 * WebWhisper Standalone Test Runner
 * Runs all 20 required specifications via Node.js
 */

const STANDARD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const CaesarCipher = {
  normalizeShift(shift) {
    const num = parseInt(shift, 10);
    if (isNaN(num)) return 3;
    return ((num % 26) + 26) % 26;
  },
  encode(text, shift) {
    if (typeof text !== 'string') return '';
    const s = this.normalizeShift(shift);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        result += String.fromCharCode(((code - 65 + s) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        result += String.fromCharCode(((code - 97 + s) % 26) + 97);
      } else {
        result += text[i];
      }
    }
    return result;
  },
  decode(text, shift) {
    const s = this.normalizeShift(shift);
    return this.encode(text, (26 - s) % 26);
  }
};

const SubstitutionCipher = {
  DEFAULT_ALPHABET: 'QWERTYUIOPASDFGHJKLZXCVBNM',
  ATBASH_ALPHABET: 'ZYXWVUTSRQPONMLKJIHGFEDCBA',
  validate(alphabet) {
    if (!alphabet || typeof alphabet !== 'string') {
      return { isValid: false, error: 'Alphabet cannot be empty.', sanitized: '' };
    }
    const sanitized = alphabet.toUpperCase().replace(/[^A-Z]/g, '');
    if (sanitized.length !== 26) {
      return { isValid: false, error: `Alphabet must be exactly 26 letters (currently ${sanitized.length}).`, sanitized };
    }
    const seen = new Set();
    const duplicates = new Set();
    for (const char of sanitized) {
      if (seen.has(char)) duplicates.add(char);
      seen.add(char);
    }
    if (duplicates.size > 0) {
      return { isValid: false, error: `Duplicate letters detected: ${Array.from(duplicates).join(', ')}`, sanitized };
    }
    return { isValid: true, error: null, sanitized };
  },
  encode(text, alphabet) {
    if (typeof text !== 'string') return '';
    const validation = this.validate(alphabet);
    if (!validation.isValid) throw new Error(validation.error);
    const key = validation.sanitized;
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = text.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        result += key[code - 65];
      } else if (code >= 97 && code <= 122) {
        result += key[code - 97].toLowerCase();
      } else {
        result += char;
      }
    }
    return result;
  },
  decode(text, alphabet) {
    if (typeof text !== 'string') return '';
    const validation = this.validate(alphabet);
    if (!validation.isValid) throw new Error(validation.error);
    const key = validation.sanitized;
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

const VigenereCipher = {
  validate(keyword) {
    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      return { isValid: false, error: 'Keyword cannot be empty.', sanitized: '' };
    }
    const trimmed = keyword.trim().toUpperCase();
    if (!/^[A-Z]+$/.test(trimmed)) {
      return { isValid: false, error: 'Keyword must contain only English letters (A–Z).', sanitized: trimmed.replace(/[^A-Z]/g, '') };
    }
    return { isValid: true, error: null, sanitized: trimmed };
  },
  encode(text, keyword) {
    if (typeof text !== 'string') return '';
    const validation = this.validate(keyword);
    if (!validation.isValid) throw new Error(validation.error);
    const key = validation.sanitized;
    let result = '';
    let keyIndex = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        const shift = key.charCodeAt(keyIndex % key.length) - 65;
        result += String.fromCharCode(((code - 65 + shift) % 26) + 65);
        keyIndex++;
      } else if (code >= 97 && code <= 122) {
        const shift = key.charCodeAt(keyIndex % key.length) - 65;
        result += String.fromCharCode(((code - 97 + shift) % 26) + 97);
        keyIndex++;
      } else {
        result += text[i];
      }
    }
    return result;
  },
  decode(text, keyword) {
    if (typeof text !== 'string') return '';
    const validation = this.validate(keyword);
    if (!validation.isValid) throw new Error(validation.error);
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

const tests = [
  { name: '1. Caesar encode: HELLO, shift 3 -> KHOOR', fn: () => CaesarCipher.encode('HELLO', 3) === 'KHOOR' },
  { name: '2. Caesar decode: KHOOR, shift 3 -> HELLO', fn: () => CaesarCipher.decode('KHOOR', 3) === 'HELLO' },
  { name: '3. Alphabet wraparound: XYZ, shift 3 -> ABC', fn: () => CaesarCipher.encode('XYZ', 3) === 'ABC' },
  { name: '4. Case preservation: Hello World! -> Khoor Zruog!', fn: () => CaesarCipher.encode('Hello World!', 3) === 'Khoor Zruog!' },
  { name: '5. Punctuation & numbers remain unchanged: 123 #Secret!', fn: () => CaesarCipher.encode('123 #Secret!', 3) === '123 #Vhfuhw!' },
  { name: '6. Empty input returns empty string gracefully', fn: () => CaesarCipher.encode('', 3) === '' && CaesarCipher.decode('', 3) === '' },
  { name: '7. Caesar shifts outside allowed range normalized: shift 29 == 3', fn: () => CaesarCipher.encode('HELLO', 29) === 'KHOOR' && CaesarCipher.encode('HELLO', -23) === 'KHOOR' },
  { name: '8. Substitution encoding and decoding use inverse mappings', fn: () => {
    const key = SubstitutionCipher.DEFAULT_ALPHABET;
    const enc = SubstitutionCipher.encode('The Quick Brown Fox', key);
    const dec = SubstitutionCipher.decode(enc, key);
    return dec === 'The Quick Brown Fox';
  }},
  { name: '9. Invalid substitution alphabets reject duplicates / bad length', fn: () => {
    const v1 = SubstitutionCipher.validate('AABCDEFGHIJKLMNOPQRSTUVWXY');
    const v2 = SubstitutionCipher.validate('SHORT');
    return v1.isValid === false && v2.isValid === false;
  }},
  { name: '10. Vigenere round-trip: ATTACK AT DAWN with LEMON', fn: () => {
    const enc = VigenereCipher.encode('ATTACK AT DAWN', 'LEMON');
    const dec = VigenereCipher.decode(enc, 'LEMON');
    return enc === 'LXFOPV EF RNHR' && dec === 'ATTACK AT DAWN';
  }},
  { name: '11. Vigenere case preservation: Attack At Dawn! -> Lxfopv Ef Rnhr!', fn: () => {
    const enc = VigenereCipher.encode('Attack At Dawn!', 'LEMON');
    const dec = VigenereCipher.decode(enc, 'LEMON');
    return enc === 'Lxfopv Ef Rnhr!' && dec === 'Attack At Dawn!';
  }},
  { name: '12. Invalid Vigenere keywords display errors / reject non-alpha', fn: () => {
    const v1 = VigenereCipher.validate('');
    const v2 = VigenereCipher.validate('123');
    return v1.isValid === false && v2.isValid === false;
  }},
  { name: '13. Vigenere spaces and punctuation do not advance keystream', fn: () => {
    const enc = VigenereCipher.encode('A A', 'AB');
    return enc === 'A B';
  }},
  { name: '14. Atbash reverse alphabet round-trip', fn: () => {
    const key = SubstitutionCipher.ATBASH_ALPHABET;
    const msg = 'Confidential Transmission 2026';
    return SubstitutionCipher.decode(SubstitutionCipher.encode(msg, key), key) === msg;
  }},
  { name: '15. Swap consistency across multiple ciphers', fn: () => {
    const orig = 'Testing Swap Routine';
    const cEnc = CaesarCipher.encode(orig, 7);
    const cDec = CaesarCipher.decode(cEnc, 7);
    const vEnc = VigenereCipher.encode(orig, 'KEY');
    const vDec = VigenereCipher.decode(vEnc, 'KEY');
    return cDec === orig && vDec === orig;
  }},
  { name: '16. Non-ASCII / Unicode text does not crash algorithm', fn: () => {
    const text = 'Secret 🔐 & Café!';
    const enc = CaesarCipher.encode(text, 3);
    const dec = CaesarCipher.decode(enc, 3);
    return dec === text;
  }},
  { name: '17. Vigenere round-trip on lowercase message', fn: () => {
    const msg = 'classical cryptography in action';
    const enc = VigenereCipher.encode(msg, 'CIPHER');
    const dec = VigenereCipher.decode(enc, 'CIPHER');
    return dec === msg;
  }},
  { name: '18. Caesar shift 0 and 26 preserve original text', fn: () => {
    const msg = 'Preserve My Text';
    return CaesarCipher.encode(msg, 0) === msg && CaesarCipher.encode(msg, 26) === msg;
  }},
  { name: '19. Substitution random alphabet generation produces valid 26 unique letters', fn: () => {
    const arr = STANDARD_ALPHABET.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const val = SubstitutionCipher.validate(arr.join(''));
    return val.isValid === true && val.sanitized.length === 26;
  }},
  { name: '20. Long message round-trip performance test', fn: () => {
    const longText = 'Cryptography '.repeat(100);
    const enc = CaesarCipher.encode(longText, 14);
    const dec = CaesarCipher.decode(enc, 14);
    return dec === longText;
  }}
];

console.log('====================================================');
console.log('   WebWhisper Test Suite — Verification Runner');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

tests.forEach((test, idx) => {
  try {
    const res = test.fn();
    if (res) {
      console.log(`[PASS] ${test.name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${test.name}`);
      failed++;
    }
  } catch (err) {
    console.error(`[ERROR] ${test.name}: ${err.message}`);
    failed++;
  }
});

console.log('\n----------------------------------------------------');
console.log(`Results: ${passed}/${tests.length} passed (${failed} failed)`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
