export const protect = async (req, res, next) => {
  try {
    const auth = req.auth();
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }
    next();
  } catch (error) {
    console.log("AUTH ERROR:", error);
    res.status(401).json({ success: false, message: error.message });
  }
};
