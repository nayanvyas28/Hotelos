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

export async function getApprovalsAction(propertyId?: string, userRole?: string) {
  try {
    const list = readDB();
    
    // Filter based on property and role hierarchy
    const filtered = list.filter((item: any) => {
      // SAAS_OWNER and MD see all items including global_corporate
      if (userRole === "SAAS_OWNER" || userRole === "MD") {
        return true;
      }
      
      // GM sees Front Office, Housekeeping, and property specific approvals
      if (userRole === "GM") {
        return item.propertyId === propertyId || item.department === "FRONT_OFFICE" || item.department === "HOUSEKEEPING";
      }

      // HOUSEKEEPER (Executive Housekeeper) sees Housekeeping department approvals
      if (userRole === "HOUSEKEEPER") {
        return item.department === "HOUSEKEEPING";
      }

      // FRONT_DESK / FRONT_OFFICE manager sees Front Office department approvals
      if (userRole === "FRONT_DESK" || userRole === "MANAGER") {
        return item.department === "FRONT_OFFICE" || item.propertyId === propertyId;
      }

      // Default fallback match by propertyId
      return !propertyId || item.propertyId === propertyId || item.propertyId === "global_corporate";
    });

    return { success: true, approvals: filtered };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPasswordResetApprovalAction(
  email: string,
  role?: string,
  department?: string,
  requestedNewPassword?: string
) {
  try {
    const list = readDB();
    
    // Determine target approver role based on requesting role/email
    let targetRole = "SAAS_OWNER";
    let depTag = department || "CORPORATE";
    
    if (role === "FRONT_DESK") {
      targetRole = "GM";
      depTag = "FRONT_OFFICE";
    } else if (role === "HOUSEKEEPER") {
      targetRole = "HOUSEKEEPER";
      depTag = "HOUSEKEEPING";
    } else {
      // MD, GM, Corporate admins -> Parent is SaaS Owner
      targetRole = "SAAS_OWNER";
      depTag = "CORPORATE";
    }

    const newApproval = {
      id: `app_pwd_${Date.now()}`,
      propertyId: "global_corporate",
      type: "PASSWORD_RESET",
      department: depTag,
      targetRole: targetRole,
      subject: `Password Reset Request — ${email}`,
      details: `User (${email}) requested a password recovery/reset. Requires ${targetRole} parent approval.`,
      amount: 0,
      status: "PENDING",
      requestor: email,
      targetEmail: email,
      newPassword: requestedNewPassword || "HotelOS#TempPass2026",
      createdAt: new Date().toISOString(),
    };

    list.unshift(newApproval);
    writeDB(list);

    return { 
      success: true, 
      message: `Password reset request for ${email} submitted to ${targetRole} (Parent Admin) for approval.`,
      approvalId: newApproval.id
    };
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

    const item = list[idx];

    list[idx] = {
      ...item,
      status,
      comments: comments || (status === "APPROVED" ? "Approved by Parent Admin" : "Rejected by Parent Admin"),
      resolvedBy,
      resolvedAt: new Date().toISOString(),
    };

    writeDB(list);
    return { 
      success: true, 
      approvedPassword: status === "APPROVED" && item.type === "PASSWORD_RESET" ? item.newPassword : undefined
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
