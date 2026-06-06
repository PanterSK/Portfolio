/* =========================================================================
   ⬇️  THIS IS THE ONLY FILE YOU NEED TO EDIT  ⬇️

   Hi Timotej! 👋  This file controls everything on your website:
   your name, your intro text, your contact links, and all your videos.

   You don't need to know how to code. Just follow the examples below,
   keep the quotes "like this", and keep the commas where they are.

   After you change something, save the file and refresh the website.
   ========================================================================= */


/* -------------------------------------------------------------------------
   1) ABOUT YOU  —  shown on the homepage and the About section
   ------------------------------------------------------------------------- */
const SITE = {

  // The big name at the top of the site.
  name: "Timotej Krist",

  // A short line under your name (your role / what you do).
  role: "Videographer",

  // A longer paragraph about yourself. Write whatever you like.
  about:
    "First-year Communication & Multimedia Design student at NHL Stenden " +
    "in Leeuwarden, the Netherlands. Originally from Slovakia. I make " +
    "videos — short films, documentary, and experimental work.",

  // Your contact / social links. To remove one, delete the whole line.
  // To add one, copy a line and change the text and the link.
  contact: [
    { label: "Email",     link: "mailto:timotej@example.com" },
    { label: "Instagram", link: "https://instagram.com/yourusername" },
    { label: "Vimeo",     link: "https://vimeo.com/yourusername" },
  ],

};


/* -------------------------------------------------------------------------
   2) YOUR VIDEOS  —  each { ... } block is one project.
   ------------------------------------------------------------------------- */
/*
   HOW TO GET YOUR VIMEO ID:
   Open your video on Vimeo. Look at the web address, for example:
       https://vimeo.com/824804225
   The number at the end ( 824804225 ) is your "vimeoId". That's all you need.
   The video thumbnail is found automatically from that number.

   HOW TO ADD A NEW VIDEO:
   Copy one whole block — from {  to  }, including the comma after it —
   and paste it at the top of the list. Then change the details.

   The TOP video in the list shows first on your site.
*/
const PROJECTS = [

  {
    title:   "Cereal Killer",
    vimeoId: "1179516729",                 // just the number from the Vimeo link
    year:    "2026",
    type:    "Comercial,                // e.g. Short Film, Documentary, Music Video
    description:
      "A short sentence or two describing this project. What it is, " +
      "what you were going for, anything you want people to know.",

    // Credits. Add or remove lines freely. Format:  { role: "...", name: "..." }
    credits: [
      { role: "Director",       name: "Timotej Krist" },
      { role: "Cinematography", name: "Timotej Krist" },
      { role: "Editor",         name: "Timotej Krist" },
    ],
  },

  {
    title:   "Eyes without a face",
    vimeoId: "1197784764",
    year:    "2025",
    type:    "Experimental",
    description:
      "Another short description goes here. Keep it brief and personal.",

    credits: [
      { role: "Director", name: "Timotej Krist" },
      { role: "Sound",    name: "A Friend's Name" },
    ],
  },

  {
    title:   "Fanta Commercial",
    vimeoId: "1160643004",
    year:    "2025",
    type:    "Comercial",
    description:
      "One more example. Delete the ones you don't need and add your own.",

    credits: [
      { role: "Director", name: "Timotej Krist" },
    ],
  },

  // ⬇️ To add a project, paste a new block here (or at the top of the list).

];
