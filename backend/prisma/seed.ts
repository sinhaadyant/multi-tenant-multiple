import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create initial permissions
  const permissions = [
    // User permissions
    {
      resource: "users",
      action: "create",
      description: "Create new users",
      category: "User Management",
    },
    {
      resource: "users",
      action: "read",
      description: "View user information",
      category: "User Management",
    },
    {
      resource: "users",
      action: "update",
      description: "Update user information",
      category: "User Management",
    },
    {
      resource: "users",
      action: "delete",
      description: "Delete users",
      category: "User Management",
    },
    {
      resource: "users",
      action: "manage",
      description: "Full user management access",
      category: "User Management",
    },

    // Role permissions
    {
      resource: "roles",
      action: "create",
      description: "Create new roles",
      category: "Role Management",
    },
    {
      resource: "roles",
      action: "read",
      description: "View role information",
      category: "Role Management",
    },
    {
      resource: "roles",
      action: "update",
      description: "Update role information",
      category: "Role Management",
    },
    {
      resource: "roles",
      action: "delete",
      description: "Delete roles",
      category: "Role Management",
    },
    {
      resource: "roles",
      action: "manage",
      description: "Full role management access",
      category: "Role Management",
    },

    // Tenant permissions
    {
      resource: "tenants",
      action: "create",
      description: "Create new tenants",
      category: "Tenant Management",
    },
    {
      resource: "tenants",
      action: "read",
      description: "View tenant information",
      category: "Tenant Management",
    },
    {
      resource: "tenants",
      action: "update",
      description: "Update tenant information",
      category: "Tenant Management",
    },
    {
      resource: "tenants",
      action: "delete",
      description: "Delete tenants",
      category: "Tenant Management",
    },
    {
      resource: "tenants",
      action: "manage",
      description: "Full tenant management access",
      category: "Tenant Management",
    },

    // Dashboard permissions
    {
      resource: "dashboard",
      action: "read",
      description: "View dashboard",
      category: "Dashboard",
    },
    {
      resource: "analytics",
      action: "read",
      description: "View analytics",
      category: "Analytics",
    },
    {
      resource: "reports",
      action: "create",
      description: "Create reports",
      category: "Reports",
    },
    {
      resource: "reports",
      action: "read",
      description: "View reports",
      category: "Reports",
    },
    {
      resource: "reports",
      action: "export",
      description: "Export reports",
      category: "Reports",
    },

    // Settings permissions
    {
      resource: "settings",
      action: "read",
      description: "View settings",
      category: "Settings",
    },
    {
      resource: "settings",
      action: "update",
      description: "Update settings",
      category: "Settings",
    },

    // Audit permissions
    {
      resource: "audit",
      action: "read",
      description: "View audit logs",
      category: "Audit",
    },

    // File permissions
    {
      resource: "files",
      action: "upload",
      description: "Upload files",
      category: "File Management",
    },
    {
      resource: "files",
      action: "read",
      description: "View files",
      category: "File Management",
    },
    {
      resource: "files",
      action: "delete",
      description: "Delete files",
      category: "File Management",
    },
  ];

  console.log("Creating permissions...");
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: permission.resource,
          action: permission.action,
        },
      },
      update: {},
      create: permission,
    });
  }

  // Create default tenant
  console.log("Creating default tenant...");
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      name: "Default Organization",
      slug: "default",
      domain: "localhost",
      status: "ACTIVE",
      settings: {
        theme: "light",
        allowRegistration: true,
        requireEmailVerification: false,
        maxUsers: 1000,
      },
    },
  });

  // Get all permissions for super admin role
  const allPermissions = await prisma.permission.findMany();
  const superAdminPermissions = allPermissions.map(
    (p) => `${p.resource}:${p.action}`
  );

  // Create default roles with proper hierarchy
  console.log("Creating default roles...");

  // Super Admin (hierarchy 0 - highest)
  const superAdminRole = await prisma.role.upsert({
    where: {
      name_tenantId: { name: "Super Admin", tenantId: defaultTenant.id },
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: "Super Admin",
      description: "Full system access with all permissions",
      permissions: superAdminPermissions,
      isDefault: false,
      isSystem: true,
      hierarchy: 0,
    },
  });

  // Tenant Admin (hierarchy 1)
  const tenantAdminPermissions = allPermissions
    .filter((p) => !p.resource.includes("tenants") || p.action === "read")
    .map((p) => `${p.resource}:${p.action}`);

  const tenantAdminRole = await prisma.role.upsert({
    where: {
      name_tenantId: { name: "Tenant Admin", tenantId: defaultTenant.id },
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: "Tenant Admin",
      description: "Full tenant management access",
      permissions: tenantAdminPermissions,
      isDefault: false,
      isSystem: true,
      hierarchy: 1,
    },
  });

  // Manager (hierarchy 2)
  const managerPermissions = [
    "users:read",
    "users:create",
    "users:update",
    "roles:read",
    "dashboard:read",
    "analytics:read",
    "reports:create",
    "reports:read",
    "reports:export",
    "files:upload",
    "files:read",
    "files:delete",
    "settings:read",
  ];

  const managerRole = await prisma.role.upsert({
    where: { name_tenantId: { name: "Manager", tenantId: defaultTenant.id } },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: "Manager",
      description: "Management access with user oversight",
      permissions: managerPermissions,
      isDefault: false,
      isSystem: true,
      hierarchy: 2,
    },
  });

  // Supervisor (hierarchy 3)
  const supervisorPermissions = [
    "users:read",
    "dashboard:read",
    "analytics:read",
    "reports:read",
    "reports:export",
    "files:upload",
    "files:read",
    "settings:read",
  ];

  const supervisorRole = await prisma.role.upsert({
    where: {
      name_tenantId: { name: "Supervisor", tenantId: defaultTenant.id },
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: "Supervisor",
      description: "Supervisory access with limited user management",
      permissions: supervisorPermissions,
      isDefault: false,
      isSystem: true,
      hierarchy: 3,
    },
  });

  // Employee (hierarchy 4)
  const employeePermissions = [
    "dashboard:read",
    "reports:read",
    "files:upload",
    "files:read",
    "settings:read",
  ];

  const employeeRole = await prisma.role.upsert({
    where: { name_tenantId: { name: "Employee", tenantId: defaultTenant.id } },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: "Employee",
      description: "Standard employee access",
      permissions: employeePermissions,
      isDefault: true,
      isSystem: true,
      hierarchy: 4,
    },
  });

  // Guest/Viewer (hierarchy 5 - lowest)
  const guestPermissions = ["dashboard:read", "reports:read", "settings:read"];

  const guestRole = await prisma.role.upsert({
    where: { name_tenantId: { name: "Guest", tenantId: defaultTenant.id } },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: "Guest",
      description: "Read-only access for guests",
      permissions: guestPermissions,
      isDefault: false,
      isSystem: true,
      hierarchy: 5,
    },
  });

  // Create role permissions relationships
  console.log("Creating role permissions...");
  const roles = [
    superAdminRole,
    tenantAdminRole,
    managerRole,
    supervisorRole,
    employeeRole,
    guestRole,
  ];

  for (const role of roles) {
    const roleData = await prisma.role.findUnique({ where: { id: role.id } });
    if (roleData?.permissions) {
      const permissionStrings = roleData.permissions as string[];

      for (const permissionString of permissionStrings) {
        const [resource, action] = permissionString.split(":");
        const permission = await prisma.permission.findUnique({
          where: { resource_action: { resource, action } },
        });

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }
  }

  // Create super admin user
  console.log("Creating super admin user...");
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const superAdminUser = await prisma.user.upsert({
    where: {
      email_tenantId: {
        email: "admin@example.com",
        tenantId: defaultTenant.id,
      },
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      email: "admin@example.com",
      password: hashedPassword,
      firstName: "Super",
      lastName: "Admin",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  // Assign super admin role to the user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: superAdminUser.id, roleId: superAdminRole.id },
    },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
      assignedBy: superAdminUser.id,
    },
  });

  // Create a demo tenant admin user
  console.log("Creating demo tenant admin user...");
  const tenantAdminUser = await prisma.user.upsert({
    where: {
      email_tenantId: {
        email: "tenant@example.com",
        tenantId: defaultTenant.id,
      },
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      email: "tenant@example.com",
      password: hashedPassword,
      firstName: "Tenant",
      lastName: "Admin",
      status: "ACTIVE",
      emailVerified: true,
      createdById: superAdminUser.id,
    },
  });

  // Assign tenant admin role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: tenantAdminUser.id, roleId: tenantAdminRole.id },
    },
    update: {},
    create: {
      userId: tenantAdminUser.id,
      roleId: tenantAdminRole.id,
      assignedBy: superAdminUser.id,
    },
  });

  console.log("✅ Database seeding completed successfully!");
  console.log("\n📋 Created:");
  console.log(`   • ${permissions.length} permissions`);
  console.log(`   • 1 default tenant (${defaultTenant.name})`);
  console.log(`   • 6 default roles`);
  console.log(`   • 2 admin users`);
  console.log("\n🔐 Login credentials:");
  console.log("   Super Admin: admin@example.com / admin123");
  console.log("   Tenant Admin: tenant@example.com / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
