export const routes = [
  { name: "home", path: "/" },
  { name: "work", path: "/work/" },
  { name: "about", path: "/about/" },
  { name: "contact", path: "/contact/" },
  { name: "project", path: "/work/protect-our-winters/" },
  { name: "privacy", path: "/privacy/" },
  { name: "terms", path: "/terms/" },
] as const;

/** First-class widths, including tablet and mid-size. 768 and 1024 are not leftovers. */
export const viewports = [
  { name: "320", width: 320, height: 720 },
  { name: "375", width: 375, height: 812 },
  { name: "390", width: 390, height: 844 },
  { name: "414", width: 414, height: 896 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1440", width: 1440, height: 900 },
] as const;

export const mobileViewports = viewports.filter((viewport) => viewport.width <= 414);

export const phoneDevices = ["iPhone SE", "iPhone 13", "iPhone 14 Pro"] as const;
