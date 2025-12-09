const { BlobServiceClient } = require("@azure/storage-blob");

const containerName = "projecthub-data";
const blobName = "state.json";
const ALLOWED_DOMAIN = "schulthess.ch";

// Hilfsfunktion: Benutzerinfo aus dem x-ms-client-principal Header lesen
function getClientPrincipal(req) {
  const header =
    req.headers["x-ms-client-principal"] ||
    req.headers["X-MS-CLIENT-PRINCIPAL"] ||
    req.headers["x-ms-client-principal".toLowerCase()];

  if (!header) return null;

  try {
    const decoded = Buffer.from(header, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

function getUserEmailFromPrincipal(principal) {
  if (!principal) return null;

  // neue SWA-Formate haben oft 'userDetails' oder 'userId'
  if (principal.userDetails && principal.userDetails.includes("@")) {
    return principal.userDetails;
  }

  if (Array.isArray(principal.claims)) {
    const emailClaim =
      principal.claims.find(c =>
        c.typ === "emails" ||
        c.typ === "preferred_username" ||
        c.typ === "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      );

    if (emailClaim && emailClaim.val && emailClaim.val.includes("@")) {
      return emailClaim.val;
    }
  }

  return null;
}

function isFromAllowedDomain(email) {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}


module.exports = async function (context, req) {
  try {
    // --- Auth & Domain-Check ---
    const principal = getClientPrincipal(req);
    const email = getUserEmailFromPrincipal(principal);

    if (!email) {
      context.res = {
        status: 401,
        body: { error: "Not authenticated" }
      };
      return;
    }

    if (!isFromAllowedDomain(email)) {
      context.res = {
        status: 403,
        body: { error: "Access denied: only @schulthess.ch allowed." }
      };
      return;
    }

    const method = (req.method || "GET").toUpperCase();
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connStr) {
      context.log.error("AZURE_STORAGE_CONNECTION_STRING not set");
      context.res = {
        status: 500,
        body: { error: "Storage connection not configured." }
      };
      return;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    // ... REST DEINER LOGIK (GET/PUT) BLEIBT WIE BISHER ...


    if (method === "OPTIONS") {
      context.res = {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      };
      return;
    }

    if (method === "GET") {
      // Wenn Datei noch nicht existiert → leeren State zurückgeben
      if (!(await blobClient.exists())) {
        const emptyState = getEmptyState();
        context.res = {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: emptyState
        };
        return;
      }

      const download = await blobClient.download(0);
      const text = await streamToString(download.readableStreamBody);
      const data = text ? JSON.parse(text) : getEmptyState();

      context.res = {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: data
      };
    } else if (method === "PUT") {
      const body = req.body;

      if (!body || typeof body !== "object") {
        context.res = {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: { error: "Body must be JSON object." }
        };
        return;
      }

      const json = JSON.stringify(body);
      await blobClient.upload(json, Buffer.byteLength(json), {
        blobHTTPHeaders: { blobContentType: "application/json" }
      });

      context.res = {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: { message: "State saved." }
      };
    } else {
      context.res = {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: { error: "Method not allowed" }
      };
    }
  } catch (err) {
    context.log.error("Error in /api/state", err);
    context.res = {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: { error: "Internal server error" }
    };
  }
};

function getEmptyState() {
  return {
    projects: [],
    members: [],
    projectTeamMembers: [],
    costs: [],
    milestones: [],
    risks: [],
    tasks: [],
    phaseTemplates: [],
    resourceBookings: []
  };
}

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", data => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

