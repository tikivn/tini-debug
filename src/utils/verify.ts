const PATTERN_EMAIL = /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const PATTERN_EMAIL_DOMAIN = /^@([\w-]+\.)+[\w-]{2,4}$/;

export const checkEmailInWhiteList: (email: string, patterns: string[]) => boolean = (
  email,
  patterns,
) => {
  return (
    patterns.filter((pattern) => {
      if (pattern.match(PATTERN_EMAIL_DOMAIN)) {
        // check domain
        const regex = new RegExp(`^[\\w-\\.]+(${pattern})`);
        return email.match(regex);
      } else if (pattern.match(PATTERN_EMAIL)) {
        // check full email
        return email === pattern;
      } else if (pattern === '*') {
        return true;
      } else {
        const regex = new RegExp(pattern);
        return email.match(regex);
      }
    }).length > 0
  );
};
