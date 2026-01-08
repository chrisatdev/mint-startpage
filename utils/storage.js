const DEFAULT_DATA = {
  settings: {
    theme: {
      type: "gradient",
      value: "linear-gradient(135deg, #9bfab0, #2dd4bf)"
    }
  },
  groups: []
};

export function loadData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["mintData"], (result) => {
      resolve(result.mintData || DEFAULT_DATA);
    });
  });
}

export function saveData(data) {
  return chrome.storage.local.set({ mintData: data });
}
