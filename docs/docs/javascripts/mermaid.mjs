import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@12.2.0/dist/mermaid.esm.min.mjs";
mermaid.registerIconPacks([
  {
    name: "logos",
    loader: () =>
      fetch("https://unpkg.com/@iconify-json/logos@1/icons.json")
        .then((res) => res.json())
        .catch((err) => console.error(err)),
  },
  {
    name: "icons",
    loader: () =>
      fetch("https://unpkg.com/@iconify-json/lucide@1/icons.json")
        .then((res) => res.json())
        .catch((err) => console.error(err)),
  }
]);

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
});

// Important: necessary to make it visible to Zensical
window.mermaid = mermaid;
