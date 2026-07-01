const DOMPurify = {
  sanitize: (str: any) => {
    if (typeof str !== "string") return "";
    return str;
  },
  addHook: () => {},
  removeHook: () => {},
};

export default DOMPurify;
