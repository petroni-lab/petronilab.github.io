(() => {
  const storageKey = "petroni-lab-theme";
  let theme = "light";

  try {
    const savedTheme = window.localStorage.getItem(storageKey);
    if (savedTheme === "light" || savedTheme === "dark") {
      theme = savedTheme;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  } catch (error) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  }

  document.documentElement.dataset.theme = theme;
})();

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const toggle = document.querySelector("[data-theme-toggle]");
  const label = toggle?.querySelector(".theme-toggle-label");
  const storageKey = "petroni-lab-theme";

  if (!toggle || !label) {
    return;
  }

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
    label.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  };

  applyTheme(root.dataset.theme || "light");

  toggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);

    try {
      window.localStorage.setItem(storageKey, nextTheme);
    } catch (error) {
      // Ignore storage failures and keep the in-memory theme.
    }
  });
});
