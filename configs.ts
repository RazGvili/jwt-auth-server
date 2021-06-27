export const JWT = {
    secret: process.env.ACCESS_TOKEN_SECRET!,
    options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' },
    refreshSecret: process.env.REFRESH_TOKEN_SECRET!,
    refreshOptions: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' },
};

// Validate configs
(() => {
    // JWT validations
    if (!JWT.secret) throw new Error('no JWT.secret');
    if (!JWT.refreshSecret) throw new Error('no JWT.refreshSecret');
})();
