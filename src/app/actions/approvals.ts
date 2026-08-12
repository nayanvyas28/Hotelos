"use server";

import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src/lib/approvals_db.json");

function readDB() {
  try {
    if (!fs.existsSync(dbPath)) {
      return [];
    }
    const raw = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read approvals DB:", e);
    return [];
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Failed to write approvals DB:", e);
    return false;
  }
}

export async function getApprovalsAction(propertyId: string) {
  try {
    const list = readDB();
    const filtered = list.filter((item: any) => item.propertyId === propertyId);
    return { success: true, approvals: filtered };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resolveApprovalAction(
  approvalId: string,
  status: "APPROVED" | "REJECTED",
  comments: string,
  resolvedBy: string
) {
  try {
    const list = readDB();
    const idx = list.findIndex((item: any) => item.id === approvalId);
    if (idx === -1) {
      throw new Error("Approval record not found.");
    }

    list[idx] = {
      ...list[idx],
      status,
      comments: comments || "Processed by executive reviewer",
      resolvedBy,
      resolvedAt: new Date().toISOString(),
    };

    writeDB(list);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
