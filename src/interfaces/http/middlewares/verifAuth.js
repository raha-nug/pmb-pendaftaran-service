export async function verifyUserToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const response = await fetch(
      `${process.env.USER_SERVICE_URL}/api/auth/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const user = await response.json();

    if (!user || !user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = user; // Simpan user ke request untuk digunakan di controller
    next();
  } catch (error) {
    throw new Error("Token tidak valid");
  }
}
