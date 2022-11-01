const decodeToken = (token: string) => {
  try {
    const parsed = JSON.parse(atob(token.split('.')[1]));
    parsed.iat = new Date(parsed.iat * 1000).toLocaleString();
    parsed.exp = new Date(parsed.exp * 1000).toLocaleString();
    return parsed;
  } catch (error) {
    return null;
  }
};

export default decodeToken;
