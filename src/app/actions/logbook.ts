"use server";

import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src/lib/logbook_db.json");

function readDB() {
  try {
    if (!fs.existsSync(dbPath)) {
      return { handovers: [], incidents: [] };
    }
    const raw = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read logbook DB:", e);
    return { handovers: [], incidents: [] };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Failed to write logbook DB:", e);
    return false;
  }
}

export async function getLogbookAction(propertyId: string) {
  try {
    const db = readDB();
    const handovers = db.handovers.filter((h: any) => h.propertyId === propertyId);
    const incidents = db.incidents.filter((i: any) => i.propertyId === propertyId);
    return { success: true, handovers, incidents };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitHandoverAction(
  propertyId: string,
  data: {
    shift: string;
    cashReconciled: number;
    outgoingManager: string;
    incomingManager: string;
    openIssues: string;
    vipArrivals: string;
  }
) {
  try {
    const db = readDB();
    const newHandover = {
      id: "ho_" + Math.random().toString(36).substring(2, 9),
      propertyId,
      businessDate: new Date().toISOString().split("T")[0],
      ...data,
      createdAt: new Date().toISOString(),
    };

    db.handovers.unshift(newHandover);
    writeDB(db);
    return { success: true, handover: newHandover };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createIncidentAction(
  propertyId: string,
  data: {
    title: string;
    category: string;
    priority: string;
    details: string;
    reportedBy: string;
    assignedTo: string;
  }
) {
  try {
    const db = readDB();
    const newIncident = {
      id: "inc_" + Math.random().toString(36).substring(2, 9),
      propertyId,
      ...data,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };

    db.incidents.unshift(newIncident);
    writeDB(db);
    return { success: true, incident: newIncident };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateIncidentStatusAction(incidentId: string, status: string) {
  try {
    const db = readDB();
    const idx = db.incidents.findIndex((i: any) => i.id === incidentId);
    if (idx === -1) {
      throw new Error("Incident not found.");
    }

    db.incidents[idx].status = status;
    db.incidents[idx].updatedAt = new Date().toISOString();

    writeDB(db);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
