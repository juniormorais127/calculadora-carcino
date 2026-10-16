// Validate the signed token, not only the user object's emailVerified property.
// Firebase may refresh the profile before replacing a previously cached token.
export function createSessionVerifier({ currentUser, readToken, refreshUser }) {
  return async uid => {
    const user = currentUser();
    const changed = () => !currentUser() || currentUser().uid !== uid;
    if (!user || user.uid !== uid) throw Object.assign(new Error('A conta mudou.'), { code: 'auth/session-changed' });
    let token = await readToken(user, false);
    if (changed()) throw Object.assign(new Error('A conta mudou.'), { code: 'auth/session-changed' });
    if (token.claims.email_verified !== true) {
      await refreshUser(user);
      if (changed()) throw Object.assign(new Error('A conta mudou.'), { code: 'auth/session-changed' });
      token = await readToken(user, true);
    }
    if (changed()) throw Object.assign(new Error('A conta mudou.'), { code: 'auth/session-changed' });
    if (token.claims.email_verified !== true) throw Object.assign(new Error('Confirme seu e-mail.'), { code: 'auth/email-not-verified' });
  };
}
