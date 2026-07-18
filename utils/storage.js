const DEFAULT_DATA = {
  settings: {
    theme: {
      type: "gradient",
      value: "linear-gradient(135deg, #9bfab0, #2dd4bf)"
    },
    darkMode: false,
    faviconMode: "favicon"
  },
  groups: []
};

export function loadData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["mintData"], (result) => {
      const data = result.mintData || DEFAULT_DATA;
      if (!data.settings.faviconMode) {
        data.settings.faviconMode = "favicon";
      }
      resolve(data);
    });
  });
}

export function saveData(data) {
  return chrome.storage.local.set({ mintData: data });
}
