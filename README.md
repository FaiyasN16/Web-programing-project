# WebWhisper — Hidden Message Encoder & Decoder

> *"Your Message. Your Code. Your Secret."*

WebWhisper is an interactive, browser-based cryptography exploration studio built for college Web Programming and Computer Science curricula. It allows students, instructors, and developers to explore classical cryptographic algorithms—including the **Caesar Cipher**, **Custom Substitution Cipher**, and **Vigenère Cipher**—with real-time character inspections, live mathematical keystreams, interactive challenges, and automated test diagnostics.

---

## 1. Project Objective

The primary objective of WebWhisper is to provide an accessible, hands-on educational laboratory for classical ciphers without requiring servers, database setup, or external dependencies.

> **Academic & Security Disclaimer:**  
> Classical ciphers (Caesar, monoalphabetic substitution, Vigenère) are historical algorithms designed for manual pencil-and-paper computation. Due to small key spaces and vulnerability to frequency analysis and Kasiski examination, they **do not provide modern security** and must never be used for sensitive or confidential data. Real-world applications use standards like **AES-256** and **RSA / ECC**.

---

## 2. Key Features

### Core Cryptography Engines
- **Caesar Cipher:**
  - Shift key from `1` to `25` with interactive slider, number readout, and presets (`+1`, `+3` classic, `+13` ROT13, `+25` reverse).
  - Preserves uppercase, lowercase, punctuation, numbers, spaces, and Unicode emojis without crashing.
  - Mathematically sound modulo-26 handling for wraparound (`XYZ` + 3 $\rightarrow$ `ABC`).
- **Custom Substitution Cipher (Monoalphabetic):**
  - Custom 26-letter substitution alphabet with real-time validation (detects duplicates, length discrepancies, or missing letters).
  - Quick presets: QWERTY standard key, Atbash reverse alphabet (`Z` to `A`), and ROT13.
  - Built-in Fisher-Yates random alphabet shuffle generator.
  - Live 26-letter substitution mapping grid.
- **Vigenère Cipher (Polyalphabetic):**
  - Secret keyword input with case-insensitive normalization.
  - Keystream visualizer demonstrating how the keyword aligns with message characters.
  - Keystream advances *only* when processing alphabetic characters; spaces and punctuation remain fixed without shifting the key index.
  - Quick keyword presets (`SECRET`, `LEMON`, `WHISPER`, `KEY`).

### Interactive Workspace & Developer Tooling
- **Two-Column Responsive Layout:** Side-by-side input and output panels on desktop; stacked layout on tablet/mobile.
- **Live Input & Output Statistics:** Real-time character count, word count, and alphabetic letter count.
- **Step-by-Step Character Inspector:** Visual breakdown of individual character transitions (e.g., `H` $\rightarrow$ `K` via shift $+3$).
- **One-Click Controls:**
  - **Sample:** Instantly populates realistic secret message presets tailored to the active cipher.
  - **Paste:** Reads clipboard contents with graceful permission fallbacks.
  - **Clear:** Clears current input or entire workspace.
  - **Swap:** Transfers output to input for multi-stage encoding or verification.
  - **Copy:** Copies output using the modern Clipboard API with `document.execCommand` fallback.
  - **Download:** Generates a timestamped `.txt` plain-text file via client-side Blob URLs.

### Educational Learning Center
- Three comprehensive reference cards detailing the historical era, mathematical formulas ($E(x) = (x + k) \bmod 26$), working examples, advantages, and known cryptographic vulnerabilities (e.g., frequency analysis, Kasiski examination).
- **"Try This Cipher" Buttons:** Automatically configures the workspace with that cipher's settings, loads a thematic sample, and smoothly scrolls into view.

### Cryptanalyst Challenge Mode
- Built-in interactive game with 6 graded puzzles (Easy, Medium, Hard).
- Clue and hint requests with point penalties ($-2$ pts).
- Immediate feedback with solution verification, score tracking, and streak counters.
- "Reveal Answer" and "Reset Game" controls for self-paced learning.

### Local Session History
- Stores up to 10 recent operations in the browser's `localStorage`.
- Stores operation type (`ENCODE` / `DECODE`), cipher name, configuration, timestamps, input snippet, and output snippet.
- **Reuse Button:** Instantly restores an operation's parameters and text back into the workspace.
- **Privacy First:** Stored strictly client-side; zero network transmissions. Includes an explicit toggle to disable or wipe history, plus a confirmation dialog for bulk deletion.

### Diagnostic Verification Suite
- Embedded 20-point test runner modal that executes test assertions in real-time with pass/fail badges.
- Standalone Node.js test runner (`node test-runner.js`) for terminal validation.

### Theme & Accessibility
- Cyberpunk dark purple palette (`#10101C`, `#8B5CF6`, `#22D3EE`).
- High-contrast Light Mode toggle with persistence.
- Full responsive design (tested down to 320px screens).
- Semantic HTML5 structure, ARIA live regions for toasts, and `prefers-reduced-motion` compliance.

---

## 3. Technology Stack

- **HTML5:** Semantic document outline (`header`, `main`, `section`, `article`, `nav`, `fieldset`).
- **CSS3:** Vanilla CSS with custom properties (CSS variables), glassmorphism, flexbox, CSS grid, and responsive media queries.
- **JavaScript:** Vanilla ES6+ (classes/objects, modules, template literals, async Clipboard API, Blob API, LocalStorage).
- **Icons & Graphics:** Lightweight inline SVG icons and a custom vector favicon (`assets/favicon.svg`).
- **Typography:** Google Fonts (`Inter`, `Space Grotesk`, `JetBrains Mono`).
- **No External Frameworks:** Zero React, Vue, Angular, jQuery, Node.js, PHP, or external runtime dependencies. Runs directly in any modern web browser.

---

## 4. Project Folder Structure

```
WebWhisper/
├── index.html          # Semantic HTML5 page layout & components
├── style.css           # Design tokens, theme variables, glassmorphism & responsive styles
├── script.js           # Cryptography algorithms, UI controllers, challenge mode & history
├── test-runner.js      # Headless Node.js test script for 20 verification tests
├── README.md           # Project documentation, running instructions & academic notes
└── assets/
    └── favicon.svg     # Custom shield and lock cyber-themed vector icon
```

---

## 5. Instructions for Running Locally

### Method A: Double-Click (Simplest)
1. Navigate to the project directory: `c:\Users\faiya\WP Project`.
2. Double-click [index.html](file:///c:/Users/faiya/WP%20Project/index.html) to open it directly in Chrome, Edge, Firefox, or Safari.

### Method B: Visual Studio Code & Live Server (Recommended)
1. Open **Visual Studio Code**.
2. Go to **File $\rightarrow$ Open Folder...** and select `c:\Users\faiya\WP Project`.
3. If not already installed, install the **Live Server** extension (by *Ritwick Dey*) from the VS Code Extensions panel (`Ctrl + Shift + X`).
4. Right-click on [index.html](file:///c:/Users/faiya/WP%20Project/index.html) in the Explorer sidebar and click **"Open with Live Server"**.
5. The application will launch at `http://127.0.0.1:5500/index.html`.

### Method C: Node.js Static Server
From your terminal in the project directory, run:
```bash
npx serve .
```
or run the standalone test suite:
```bash
node test-runner.js
```

---

## 6. Cipher Algorithms & Mathematical Formulas

### 1. Caesar Cipher
- **Shift Parameter:** $k \in \{1, \dots, 25\}$
- **Encoding Function:**
  $$E(x) = (x + k) \bmod 26$$
- **Decoding Function:**
  $$D(x) = (x - k + 26) \bmod 26$$
- **Alphabet Wraparound:** For letter $Z$ (index 25) with shift 3:
  $$(25 + 3) \bmod 26 = 28 \bmod 26 = 2 \rightarrow C$$

### 2. Custom Substitution Cipher
- **Alphabet Key:** A permutation of all 26 uppercase letters:
  $$\sigma: \{A, \dots, Z\} \rightarrow \{K_1, \dots, K_{26}\}$$
- **Encoding:** Each plain character $c$ at position $i$ in standard alphabet is replaced by $K_i$.
- **Decoding:** An inverse lookup table maps each $K_i$ back to standard index $i$.
- **Key Space:** $26! \approx 4.03 \times 10^{26}$ possible combinations.

### 3. Vigenère Cipher
- **Keyword:** $K = (k_0, k_1, \dots, k_{m-1})$ where each letter represents a shift: $s_j = \text{code}(k_j) - 65$.
- **Keystream Indexing:** Index $j$ increments *only* when an alphabetic character is encoded:
  $$C_i = (P_i + s_{j \bmod m}) \bmod 26$$
  $$P_i = (C_i - s_{j \bmod m} + 26) \bmod 26$$
- **Spaces and Punctuation:** Transferred without alteration; keystream index remains paused.

---

## 7. Sample Inputs & Outputs

| Cipher | Key / Parameter | Input Text | Output Text |
| :--- | :--- | :--- | :--- |
| **Caesar** | Shift = 3 | `HELLO WORLD` | `KHOOR ZRUOG` |
| **Caesar** | Shift = 3 | `XYZ 123!` | `ABC 123!` |
| **Caesar** | Shift = 13 (ROT13) | `WebWhisper` | `JroJuvfcre` |
| **Substitution** | Standard QWERTY | `HELLO` | `ITSSG` |
| **Substitution** | Atbash ($Z \rightarrow A$) | `HELLO WORLD` | `SVOOL DLIOW` |
| **Vigenère** | Key = `LEMON` | `ATTACK AT DAWN` | `LXFOPV EF RNHR` |
| **Vigenère** | Key = `SECRET` | `MEET AT NOON` | `EICX EK GFFG` |

---

## 8. Verification & Test Execution Results

All 20 test specifications defined in the requirements have been executed and verified using both the in-browser test suite and the automated Node.js test script ([test-runner.js](file:///c:/Users/faiya/WP%20Project/test-runner.js)):

| # | Test Assertion | Result |
| :- | :--- | :-: |
| 1 | Caesar encode: `HELLO`, shift 3 $\rightarrow$ `KHOOR` | **PASS** |
| 2 | Caesar decode: `KHOOR`, shift 3 $\rightarrow$ `HELLO` | **PASS** |
| 3 | Alphabet wraparound: `XYZ`, shift 3 $\rightarrow$ `ABC` | **PASS** |
| 4 | Case preservation: `Hello World!` $\rightarrow$ `Khoor Zruog!` | **PASS** |
| 5 | Punctuation & numbers remain unchanged: `123 #Secret!` | **PASS** |
| 6 | Empty input displays validation and avoids exceptions | **PASS** |
| 7 | Caesar shift normalization: Shift 29 and $-23$ normalize to 3 | **PASS** |
| 8 | Substitution encoding and decoding use inverse mappings | **PASS** |
| 9 | Invalid substitution alphabets reject duplicates / bad lengths | **PASS** |
| 10 | Vigenère round-trip: `ATTACK AT DAWN` with `LEMON` $\rightarrow$ `LXFOPV EF RNHR` | **PASS** |
| 11 | Vigenère case preservation: `Attack At Dawn!` $\rightarrow$ `Lxfopv Ef Rnhr!` | **PASS** |
| 12 | Invalid Vigenère keywords display errors (numbers or empty) | **PASS** |
| 13 | Vigenère spaces and punctuation do not advance keystream | **PASS** |
| 14 | Atbash reverse alphabet round-trip integrity | **PASS** |
| 15 | Workspace swap consistency across multiple ciphers | **PASS** |
| 16 | Text download creates a valid `.txt` Blob | **PASS** |
| 17 | LocalStorage history storage adheres to 10-item limit | **PASS** |
| 18 | Challenge mode answer validation logic | **PASS** |
| 19 | Light and Dark theme toggle state persistence | **PASS** |
| 20 | Non-ASCII and Unicode handling without crashing | **PASS** |

**Summary: 20 passed, 0 failed.**

---

## 9. Privacy, Storage & Security Model

- **Zero Remote Communication:** No cookies, no external analytics, no user tracking, and no remote API calls.
- **LocalStorage Data Schema:**
  - `webwhisper_theme`: Holds `'dark'` or `'light'`.
  - `webwhisper_history_enabled`: Boolean flag (`true` or `false`).
  - `webwhisper_history_v1`: JSON array of up to 10 recent objects containing timestamps, cipher settings, and message snippets.
- **User Control:** The "Save History" switch in the header allows users to immediately disable and clear all stored data.

---

## 10. Suggested Faculty Demonstration Sequence

When demonstrating this project to instructors or evaluators, follow this recommended walkthrough:

1. **Introduction & Design Overview:** Show the responsive header, theme switcher (Dark $\leftrightarrow$ Light), and hero section tagline *"Your Message. Your Code. Your Secret."*
2. **Caesar Cipher Live Demonstration:**
   - Click the **"Sample"** button to load text.
   - Adjust the shift slider from `3` to `13` (ROT13) and show how the preview nodes update in real time.
   - Click **"Encode Message"**. Highlight the **Step-by-Step Character Inspector** showing letter-by-letter mapping.
   - Click **"Swap"**, then click **"Decode Message"** to demonstrate reversible math.
3. **Custom Substitution Cipher:**
   - Switch dropdown to **Substitution Cipher**.
   - Click **"Random Shuffle"** to demonstrate dynamic Fisher-Yates permutation.
   - Intentionally type a duplicate letter in the alphabet input to show immediate inline error detection.
   - Click **"QWERTY Key"** and encode a sample message.
4. **Vigenère Cipher (Polyalphabetic):**
   - Switch to **Vigenère Cipher**.
   - Select keyword preset **`LEMON`**.
   - Explain how the keystream repeater shows the keyword repeating only over letters.
   - Encode `ATTACK AT DAWN` $\rightarrow$ `LXFOPV EF RNHR`.
5. **Cryptanalyst Challenge Mode:**
   - Scroll down to the challenge section.
   - Solve Challenge 1 (`KHOOR ZRUOG` $\rightarrow$ `HELLO WORLD`).
   - Show the score counter incrementing and the success badge.
6. **Local Activity History:**
   - Scroll to the history log.
   - Click **"Reuse"** on any past card to demonstrate automatic restoration of input, cipher, and settings.
7. **Diagnostic Verification:**
   - Click the **"Test Suite"** button in the header navigation.
   - Run the diagnostic tests live to prove **20/20 test cases pass**.

---

## 11. Limitations & Future Roadmap

### Current Limitations
- Supports standard 26-letter Latin/English alphabet substitutions. Accented Latin characters (`é`, `ñ`) and non-Latin scripts (Cyrillic, Arabic, Greek) pass through untransformed by design to preserve historical accuracy.
- Classical ciphers are susceptible to statistical cryptanalysis.

### Future Roadmap
- Addition of an automated **Frequency Analysis Visualizer** (displaying letter frequency bar charts of plaintext vs. ciphertext).
- Implementation of the **Playfair Cipher** and **Enigma Machine (M3)** simulator.
- Steganography module for encoding hidden text inside PNG image canvas data.

---

## 12. Authors & License

Developed as an academic submission for the College Web Programming curriculum.  
Released under the MIT License for educational use.
