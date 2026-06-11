import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthRequest } from "../middleware/auth";
import {
  createCompanyProfile,
  getCompanyProfileById,
  getCompanyProfileByEmail,
  getCompanyProfileByTin,
  getAllCompanyProfiles,
  getCompanyProfilesByStatus,
  updateCompanyProfile,
  deleteCompanyProfile,
  searchCompanyProfiles,
  filterCompanyProfiles,
  WasteCompanyProfile,
} from "../models/wasteCollectorModel";
import { createUser, deleteUser, findUserByEmail } from "../models/userModel";
import { getHouseholdsByDistrict } from "../models/householdModel";

/**
 * Create new company profile
 */
export const createCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      company_name,
      email,
      phone,
      owner_name,
      owner_email,
      owner_phone,
      tin,
      address,
      description,
      district,
      sector,
      cell,
      village,
      company_logo,
      company_images,
      company_type,
      years_of_experience,
      number_of_employees,
      manager_name,
      manager_email,
      manager_phone,
      manager_position,
      manager_national_id,
      drivers,
      vehicles,
      certificates,
      rdb_certificates,
      tax_certificates,
      service_areas,
      notes,
    } = req.body;

    // Validation
    if (!company_name || !email || !phone) {
      res.status(400).json({ message: "company_name, email, and phone are required" });
      return;
    }

    // Check if email already exists
    const existingEmail = await getCompanyProfileByEmail(email);
    if (existingEmail) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    // Check if TIN already exists
    if (tin) {
      const existingTin = await getCompanyProfileByTin(tin);
      if (existingTin) {
        res.status(409).json({ message: "TIN already registered" });
        return;
      }
    }

    const companyData: Partial<WasteCompanyProfile> = {
      company_name,
      email,
      phone,
      owner_name,
      owner_email,
      owner_phone,
      tin,
      address,
      description,
      district,
      sector,
      cell,
      village,
      company_logo,
      company_images: company_images || [],
      company_type,
      years_of_experience: years_of_experience || 0,
      number_of_employees: number_of_employees || 0,
      manager_name,
      manager_email,
      manager_phone,
      manager_position,
      manager_national_id,
      drivers: drivers || [],
      vehicles: vehicles || [],
      certificates: certificates || [],
      rdb_certificates: rdb_certificates || [],
      tax_certificates: tax_certificates || [],
      service_areas: service_areas || [],
      notes,
      status: "pending",
      is_active: true,
    };

    const newCompany = await createCompanyProfile(companyData);
    res.status(201).json({ message: "Company profile created successfully", company: newCompany });
  } catch (error) {
    console.error("Error creating company profile:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Admin creates a company account and profile in one action.
 * The email is used as the company username for signing in.
 */
export const createCompanyWithAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "Only admins can create company accounts" });
      return;
    }

    const company_name = String(req.body.company_name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const password = String(req.body.password || "").trim();
    const confirm_password = String(req.body.confirm_password || "").trim();

    if (!company_name || !email || !phone || !password || !confirm_password) {
      res.status(400).json({ message: "company_name, email, phone, password, and confirm_password are required" });
      return;
    }

    if (password !== confirm_password) {
      res.status(400).json({ message: "Passwords do not match" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    const existingCompany = await getCompanyProfileByEmail(email);
    if (existingCompany) {
      res.status(409).json({ message: "Company email already registered" });
      return;
    }

    const tin = req.body.tin ? String(req.body.tin).trim() : "";
    if (tin) {
      const existingTin = await getCompanyProfileByTin(tin);
      if (existingTin) {
        res.status(409).json({ message: "TIN already registered" });
        return;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(company_name, email, phone, "waste_collector", hashedPassword);

    try {
      const companyData: Partial<WasteCompanyProfile> = {
        company_name,
        email,
        phone,
        owner_name: req.body.owner_name,
        owner_email: req.body.owner_email,
        owner_phone: req.body.owner_phone,
        tin: tin || undefined,
        address: req.body.address,
        description: req.body.description,
        district: req.body.district,
        sector: req.body.sector,
        cell: req.body.cell,
        village: req.body.village,
        company_logo: req.body.company_logo,
        company_images: req.body.company_images || [],
        company_type: req.body.company_type,
        years_of_experience: req.body.years_of_experience || 0,
        number_of_employees: req.body.number_of_employees || 0,
        manager_name: req.body.manager_name,
        manager_email: req.body.manager_email,
        manager_phone: req.body.manager_phone,
        manager_position: req.body.manager_position,
        manager_national_id: req.body.manager_national_id,
        drivers: req.body.drivers || [],
        vehicles: req.body.vehicles || [],
        certificates: req.body.certificates || [],
        rdb_certificates: req.body.rdb_certificates || [],
        tax_certificates: req.body.tax_certificates || [],
        service_areas: req.body.service_areas || [],
        notes: req.body.notes,
        status: "pending",
        is_active: true,
      };

      const company = await createCompanyProfile(companyData);

      res.status(201).json({
        message: "Company account created successfully",
        credentials: {
          username: email,
          password,
        },
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
        company,
      });
    } catch (error) {
      await deleteUser(user.id).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    console.error("Error creating company account:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Get company profile by ID
 */
export const getCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const company = await getCompanyProfileById(Number(id));
    
    if (!company) {
      res.status(404).json({ message: "Company profile not found" });
      return;
    }

    res.json({ company });
  } catch (error) {
    console.error("Error fetching company profile:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Get company profile by email
 */
export const getCompanyByEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.params;
    const emailStr = Array.isArray(email) ? email[0] : email;
    
    const company = await getCompanyProfileByEmail(emailStr);
    
    if (!company) {
      res.status(404).json({ message: "Company profile not found" });
      return;
    }

    res.json({ company });
  } catch (error) {
    console.error("Error fetching company profile:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Get company profile by TIN
 */
export const getCompanyByTin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tin } = req.params;
    const tinStr = Array.isArray(tin) ? tin[0] : tin;
    
    const company = await getCompanyProfileByTin(tinStr);
    
    if (!company) {
      res.status(404).json({ message: "Company profile not found" });
      return;
    }

    res.json({ company });
  } catch (error) {
    console.error("Error fetching company profile:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Get all company profiles with pagination
 */
export const getAllCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = "50", offset = "0" } = req.query;
    
    const companies = await getAllCompanyProfiles(Number(limit), Number(offset));
    
    res.json({ count: companies.length, limit: Number(limit), offset: Number(offset), data: companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Get companies by status
 */
export const getCompaniesByStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.params;
    const statusStr = Array.isArray(status) ? status[0] : status;
    
    const validStatuses = ["pending", "approved", "rejected", "suspended"];
    if (!validStatuses.includes(statusStr)) {
      res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      return;
    }
    
    const companies = await getCompanyProfilesByStatus(statusStr);
    
    res.json({ status, count: companies.length, data: companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Update company profile
 */
export const updateCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check company exists
    const company = await getCompanyProfileById(Number(id));
    if (!company) {
      res.status(404).json({ message: "Company profile not found" });
      return;
    }

    // Prevent updating id and created_at
    delete updateData.id;
    delete updateData.created_at;

    // Check if new email conflicts
    if (updateData.email && updateData.email !== company.email) {
      const existingEmail = await getCompanyProfileByEmail(updateData.email);
      if (existingEmail) {
        res.status(409).json({ message: "Email already in use" });
        return;
      }
    }

    // Check if new TIN conflicts
    if (updateData.tin && updateData.tin !== company.tin) {
      const existingTin = await getCompanyProfileByTin(updateData.tin);
      if (existingTin) {
        res.status(409).json({ message: "TIN already in use" });
        return;
      }
    }

    const updatedCompany = await updateCompanyProfile(Number(id), updateData);
    
    res.json({ message: "Company profile updated successfully", company: updatedCompany });
  } catch (error) {
    console.error("Error updating company profile:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Delete company profile
 */
export const deleteCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check company exists
    const company = await getCompanyProfileById(Number(id));
    if (!company) {
      res.status(404).json({ message: "Company profile not found" });
      return;
    }

    await deleteCompanyProfile(Number(id));
    
    res.json({ message: "Company profile deleted successfully", company_id: id });
  } catch (error) {
    console.error("Error deleting company profile:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Search company profiles
 */
export const searchCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({ message: "Search term 'q' is required" });
      return;
    }

    const companies = await searchCompanyProfiles(q);
    
    res.json({ query: q, count: companies.length, data: companies });
  } catch (error) {
    console.error("Error searching companies:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Filter company profiles
 */
export const filterCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, is_active, company_type, district } = req.query;

    const filters: Partial<WasteCompanyProfile> = {};
    if (status) filters.status = String(status) as any;
    if (is_active !== undefined) filters.is_active = is_active === "true";
    if (company_type) filters.company_type = String(company_type);
    if (district) filters.district = String(district);

    const companies = await filterCompanyProfiles(filters);
    
    res.json({ filters, count: companies.length, data: companies });
  } catch (error) {
    console.error("Error filtering companies:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Approve company profile (Admin only)
 */
export const approveCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { review_notes } = req.body;

    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "Only admins can approve companies" });
      return;
    }

    const company = await getCompanyProfileById(Number(id));
    if (!company) {
      res.status(404).json({ message: "Company profile not found" });
      return;
    }

    const updatedCompany = await updateCompanyProfile(Number(id), {
      status: "approved",
      review_notes: review_notes || null,
      reviewed_at: new Date(),
      reviewed_by: req.user?.id,
    });
    
    res.json({ message: "Company approved successfully", company: updatedCompany });
  } catch (error) {
    console.error("Error approving company:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Reject company profile (Admin only)
 */
export const rejectCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "Only admins can reject companies" });
      return;
    }

    const company = await getCompanyProfileById(Number(id));
    if (!company) {
      res.status(404).json({ message: "Company profile not found" });
      return;
    }

    const updatedCompany = await updateCompanyProfile(Number(id), {
      status: "rejected",
      review_notes: reason || null,
      reviewed_at: new Date(),
      reviewed_by: req.user?.id,
    });
    
    res.json({ message: "Company rejected successfully", reason, company: updatedCompany });
  } catch (error) {
    console.error("Error rejecting company:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Suspend company profile (Admin only)
 */
export const suspendCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "Only admins can suspend companies" });
      return;
    }

    const company = await getCompanyProfileById(Number(id));
    if (!company) {
      res.status(404).json({ message: "Company profile not found" });
      return;
    }

    const updatedCompany = await updateCompanyProfile(Number(id), { status: "suspended", is_active: false });
    
    res.json({ message: "Company suspended successfully", company: updatedCompany });
  } catch (error) {
    console.error("Error suspending company:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Get all citizens (households) registered in the company's district
 */
export const getCitizensByCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const company = await getCompanyProfileById(Number(id));
    if (!company) {
      res.status(404).json({ message: "Company not found" });
      return;
    }
    if (!company.district) {
      res.json({ count: 0, citizens: [] });
      return;
    }
    const citizens = await getHouseholdsByDistrict(company.district);
    res.json({ count: citizens.length, district: company.district, citizens });
  } catch (error) {
    console.error("Error fetching citizens:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};

/**
 * Reactivate company profile
 */
export const reactivateCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await getCompanyProfileById(Number(id));
    if (!company) {
      res.status(404).json({ message: "Company profile not found" });
      return;
    }

    const updatedCompany = await updateCompanyProfile(Number(id), { is_active: true });
    
    res.json({ message: "Company reactivated successfully", company: updatedCompany });
  } catch (error) {
    console.error("Error reactivating company:", error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
};
