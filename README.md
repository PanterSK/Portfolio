# Timotej Krist — Videography Portfolio

A minimal, video-first portfolio. Everything you'll ever change lives in **one file: `content.js`**. No coding needed.

---

## 📁 What's in this folder

| File | What it's for | Do you edit it? |
|------|----------------|-----------------|
| **`content.js`** | Your name, about text, contact links, and all your videos. | ✅ **Yes — this is your file.** |
| `index.html` | The page itself. | ❌ No |
| `style.css` | The look (colours, spacing). | ❌ No (optional: colours at the top) |
| `app.js` | The engine that builds the site. | ❌ No |
| `README.md` | This guide. | — |

---

## ▶️ How to see your site

Just **double-click `index.html`** — it opens in your web browser. That's it.
After you edit `content.js`, **save** and **refresh** the browser (Cmd/Ctrl + R).

---

## ➕ How to add a video

1. Open your video on **Vimeo** and copy the number from its link.
   Example: `https://vimeo.com/824804225` → the ID is **`824804225`**.
2. Open **`content.js`** in any text editor (TextEdit, VS Code, Notepad…).
3. Find the `PROJECTS` list. Copy one full block — from `{` to `},` — and paste it
   **at the top** of the list (the top video shows first).
4. Change the title, ID, year, type, description, and credits.
5. Save → refresh the browser.

```js
{
  title:   "My New Film",
  vimeoId: "824804225",        // just the number from the Vimeo link
  year:    "2026",
  type:    "Short Film",
  description: "A line about the project.",
  credits: [
    { role: "Director", name: "Timotej Krist" },
    { role: "Editor",   name: "Timotej Krist" },
  ],
},
```

**The thumbnail image is found automatically** from the Vimeo number — you don't
have to upload anything. (If you ever want a custom thumbnail, add a line like
`thumbnail: "myimage.jpg",` and put the image in this folder.)

---

## ✏️ How to change your name / about / contact

In `content.js`, edit the `SITE` block at the top:

```js
const SITE = {
  name: "Timotej Krist",
  role: "Videographer",
  about: "Write whatever you like here.",
  contact: [
    { label: "Email",     link: "mailto:you@example.com" },
    { label: "Instagram", link: "https://instagram.com/yourusername" },
  ],
};
```

To **remove** a contact link, delete its whole line. To **add** one, copy a line.

---

## ✅ A few rules so nothing breaks

- Keep the **quotes** `"like this"` around text.
- Keep the **commas** `,` at the end of lines.
- Don't delete the `{` `}` `[` `]` symbols — they hold things together.
- If something looks broken, you probably removed a quote or comma. Undo (Cmd/Ctrl + Z).

---

## 🌐 How visitors use the site

- The homepage shows a clean grid of your videos.
- **Click a video** → it opens full-screen and plays from Vimeo.
- A **“Next”** bar at the bottom jumps to the next project (also works with the → arrow key).
- A **“Credits”** button reveals the cast & crew.
- **Esc** or **Close** returns to the homepage.

---

## 🚀 Putting it online (free, optional)

Drag this whole folder onto **[netlify.com/drop](https://app.netlify.com/drop)** —
it gives you a live web address in seconds. Other free options: GitHub Pages, Vercel.
To update later, edit `content.js` and re-upload the folder.
