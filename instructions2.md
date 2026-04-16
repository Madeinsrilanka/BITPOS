# POSBIT - පද්ධතිය ස්ථාපනය සහ භාවිතය සඳහා උපදෙස්

මෙම POS පද්ධතිය Node.js තාක්ෂණය මත පදනම්ව නිපදවා ඇති අතර, එය PC එකේ සහ ජංගම දුරකථනයේ (Mobile Scanner) එකවර භාවිතා කළ හැක.

---

### 1. පූර්ව අවශ්‍යතා (Prerequisites)
පද්ධතිය ක්‍රියාත්මක කිරීමට පෙර ඔබේ පරිගණකයේ **Node.js** ස්ථාපනය කර තිබිය යුතුය. (Download: [nodejs.org](https://nodejs.org/))

---

### 2. පද්ධතිය ක්‍රියාත්මක කිරීම (Run the System)
1. ඔබේ Project folder එක (POSBIT) VS Code මඟින් විවෘත කරන්න.
2. නව Terminal එකක් (Ctrl + `) විවෘත කරන්න.
3. පහත අණැවුම ලබා දී Server එක ක්‍රියාත්මක කරන්න:
   ```bash
   node server.js
   ```
4. දැන් ඔබට Terminal එකේ පද්ධතියට පිවිසිය යුතු ලිපින (URLs) දැකගත හැකි වනු ඇත.

---

### 3. PC එකේ POS විවෘත කිරීම
ඔබේ Browser එකේ (Chrome/Edge) පහත ලිපිනය ටයිප් කරන්න:
`http://localhost:3000`

---

### 4. ජංගම දුරකථනය සම්බන්ධ කිරීම (Mobile Scanner)
මෙම විශේෂාංගය මඟින් ඔබේ Phone එක Barcode Scanner එකක් ලෙස භාවිතා කළ හැක.

1. ඔබේ Phone එක සහ PC එක **එකම Wi-Fi ජාලයකට** සම්බන්ධ වී ඇති බව තහවුරු කරගන්න.
2. Terminal එකේ පෙන්වන Mobile Scanner URL එක (උදා: `http://192.168.1.10:3000/mobile`) Phone එකෙන් විවෘත කරන්න.
3. **"Start Scanner"** බොත්තම ඔබා කැමරාවට අවසර (Allow Camera) ලබා දෙන්න.
4. භාණ්ඩයක Barcode එක scan වූ පසු **"Add to PC POS"** බොත්තම ඔබන්න.
5. එවිට PC එකේ Billing page එකේ බිලට එම භාණ්ඩය ස්වයංක්‍රීයව එකතු වේ.

---

### 💡 වැදගත් උපදෙස් (Tips)
*   **කැමරාව වැඩ නොකරන්නේ නම්:** ආරක්ෂක හේතූන් මත ඇතැම් Phone වල `http` හරහා කැමරාව ක්‍රියා නොකරයි. එවැනි අවස්ථාවක **ngrok** භාවිතා කර `https` link එකක් ලබාගන්න (Command: `ngrok http 3000`).
*   **වෙනත් පද්ධති:** පද්ධතිය ක්‍රියාත්මක වන විට `node server.js` window එක වසා නොදමන්න.

---

**English Summary:**
1. Install Node.js.
2. Run `node server.js` in terminal.
3. Open `http://localhost:3000` on PC.
4. Open the displayed IP address (e.g., `http://192.168.1.10:3000/mobile`) on your phone.
5. Scan and enjoy real-time billing!
