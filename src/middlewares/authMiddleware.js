const jwt = require("jsonwebtoken");
const { accessTokenSecrete } = require("../config");


const userAuthMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer")) return res.status(401).json({ statusCode: 401, message: "Unauthorized", data: null });

    const token = authHeader.split(" ")[1]; 
    if (!token) return res.status(401).json({ statusCode: 401, message: "Unauthorized", data: null });

    try {
        const decoded = jwt.verify(token, accessTokenSecrete);
        // console.log(decoded);
        if (decoded.role !== "User") return res.status(403).json({ statusCode: 403, message: "Forbidden", data: null });
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ statusCode: 401, message: "Invalid token", data: null });
    }
};

const adminAuthMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ statusCode: 401, message: "Unauthorized", data: null });

    const token = authHeader.split(" ")[1]; 

    if (!token) return res.status(401).json({ statusCode: 401, message: "Unauthorized", data: null });

    try {
        const decoded = jwt.verify(token, accessTokenSecrete);
        if (decoded.role !== "Admin" ) return res.status(403).json({ statusCode: 403, message: "Forbidden", data: null });
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ statusCode: 401, message: "Invalid token", data: null });
    }
};

const adminAndSuperAdmin= (req, res, next) => {
  
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ statusCode: 401, message: "Unauthorized", data: null });

    const token = authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ gstatusCode: 401, message: "Unauthorized", data: null });

    try {
        const decoded = jwt.verify(token, accessTokenSecrete);
        if (decoded.role !== "Admin" && decoded.role !== "SuperAdmin" ) return res.status(403).json({ statusCode: 403, message: "Forbidden", data: null });
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ statusCode: 401, message: "Invalid token", data: null });
    }
};


const superAdminAuthMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ statusCode: 401, message: "Unauthorized", data: null }); 

    const token = authHeader.split(" ")[1]; 

    if (!token) return res.status(401).json({ statusCode: 401, message: "Unauthorized", data: null });

    try {
        const decoded = jwt.verify(token, accessTokenSecrete);
        if (decoded.role !== "SuperAdmin" ) return res.status(403).json({ statusCode: 403, message: "Forbidden", data: null });
        req.SuperAdmin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ statusCode: 401, message: "Invalid token", data: null });
    }
};


const publicPrivateMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");


    if (!authHeader || !authHeader.startsWith("Bearer")) return res.status(401).json({ statusCode: 401, message: "Unauthorized", data: null });

    const token = authHeader.split(" ")[1]; 
    if (!token) return res.status(401).json({ statusCode: 401, message: "Unauthorized", data: null });

    try {
        const decoded = jwt.verify(token, accessTokenSecrete);

        console.log(decoded);

        if (decoded.role === "User" || decoded.role === "Admin"|| decoded.role === "SuperAdmin"){
            req.user = decoded;
            next();
        } 
        
        else return res.status(403).json({ statusCode: 403, message: "Forbidden", data: null });
        
    } catch (error) {
        res.status(401).json({ statusCode: 401, message: "Invalid token", data: null });
    }
};

module.exports = { adminAuthMiddleware, userAuthMiddleware ,publicPrivateMiddleware,superAdminAuthMiddleware,adminAndSuperAdmin};



