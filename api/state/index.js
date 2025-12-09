const { BlobServiceClient } = require("@azure/storage-blob");

const containerName = "projecthub-data";
const blobName = "state.json";

module.exports = async function (context, req) {
  try {
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
