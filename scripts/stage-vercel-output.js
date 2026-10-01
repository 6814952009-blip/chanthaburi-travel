const { cpSync, existsSync, rmSync } = require("node:fs");
const { resolve } = require("node:path");

const clientOutput = resolve(__dirname, "../client/dist");
const deploymentOutput = resolve(__dirname, "../dist");

if (!existsSync(clientOutput)) {
    throw new Error("Client build output was not found at client/dist");
}

rmSync(deploymentOutput, { recursive: true, force: true });
cpSync(clientOutput, deploymentOutput, { recursive: true });