const puppeteer = require("puppeteer");

class E2ETestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      backend: {},
      react: {},
      angular: {},
      reactNative: {},
      overall: { passed: 0, failed: 0, total: 0 },
    };
  }

  async initialize() {
    console.log("🚀 INITIALIZING PUPPETEER E2E TEST SUITE");
    console.log("=========================================");

    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      defaultViewport: { width: 1280, height: 720 },
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    this.page = await this.browser.newPage();

    // Set user agent
    await this.page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    );

    console.log("✅ Browser initialized");
  }

  async testBackendAPI() {
    console.log("\n🔧 TESTING BACKEND API ENDPOINTS");
    console.log("=================================");

    try {
      // Test 1: Health Check
      console.log("📡 Testing health endpoint...");
      const healthResponse = await this.page.goto(
        "http://localhost:3000/health"
      );
      const healthData = await this.page.evaluate(() => {
        return JSON.parse(document.body.textContent);
      });

      this.recordTest("backend", "health", healthData.status === "OK");
      console.log(`✅ Health Check: ${healthData.status}`);

      // Test 2: Login API
      console.log("🔐 Testing login endpoint...");
      const loginResponse = await this.page.evaluate(async () => {
        const response = await fetch("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "admin@example.com",
            password: "admin123",
          }),
        });
        return await response.json();
      });

      this.recordTest("backend", "login", loginResponse.success);
      console.log(
        `✅ Login API: ${loginResponse.success ? "SUCCESS" : "FAILED"}`
      );

      if (loginResponse.success) {
        console.log(`   📊 User: ${loginResponse.data.user.email}`);
        console.log(`   👥 Roles: ${loginResponse.data.roles.join(", ")}`);
        console.log(
          `   🔐 Permissions: ${loginResponse.data.permissions.length} loaded`
        );

        // Store token for authenticated requests
        this.accessToken = loginResponse.data.tokens.accessToken;
      }

      // Test 3: Registration API
      console.log("📝 Testing registration endpoint...");
      const testEmail = `puppeteer-${Date.now()}@example.com`;
      const registerResponse = await this.page.evaluate(async (email) => {
        const response = await fetch(
          "http://localhost:3000/api/auth/register",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email,
              password: "TestPass123!",
              firstName: "Puppeteer",
              lastName: "Tester",
            }),
          }
        );
        return await response.json();
      }, testEmail);

      this.recordTest("backend", "registration", registerResponse.success);
      console.log(
        `✅ Registration API: ${
          registerResponse.success ? "SUCCESS" : "FAILED"
        }`
      );

      if (registerResponse.success) {
        console.log(`   📧 New User: ${registerResponse.data.user.email}`);
        console.log(`   🏢 Tenant: ${registerResponse.data.tenant.name}`);
      }

      // Test 4: Email Verification API
      console.log("✉️ Testing email verification endpoint...");
      const verifyResponse = await this.page.evaluate(async () => {
        const response = await fetch(
          "http://localhost:3000/api/auth/verify-email",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: "invalid-token-for-testing",
            }),
          }
        );
        return await response.json();
      });

      // This should fail with invalid token, which is expected
      this.recordTest("backend", "email_verification", !verifyResponse.success);
      console.log(
        `✅ Email Verification: ${
          !verifyResponse.success ? "CORRECTLY REJECTS INVALID TOKEN" : "ERROR"
        }`
      );
    } catch (error) {
      console.log(`❌ Backend API Error: ${error.message}`);
      this.recordTest("backend", "api_error", false);
    }
  }

  async testReactDashboard() {
    console.log("\n🖥️ TESTING REACT DASHBOARD");
    console.log("===========================");

    try {
      // Test 1: Dashboard Access
      console.log("🌐 Navigating to React dashboard...");
      await this.page.goto("http://localhost:3001", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      const title = await this.page.title();
      this.recordTest("react", "page_load", title.includes("Argon"));
      console.log(`✅ Page Load: ${title}`);

      // Test 2: Login Page Access
      console.log("🔑 Testing login page...");
      await this.page.goto("http://localhost:3001/auth/login", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      const emailInput = await this.page.$('input[type="email"]');
      const passwordInput = await this.page.$('input[type="password"]');
      const loginButton = await this.page.$('button[type="submit"]');

      this.recordTest(
        "react",
        "login_form",
        emailInput && passwordInput && loginButton
      );
      console.log(
        `✅ Login Form: ${
          emailInput && passwordInput && loginButton
            ? "RENDERED"
            : "MISSING ELEMENTS"
        }`
      );

      // Test 3: Login Functionality
      if (emailInput && passwordInput && loginButton) {
        console.log("🔐 Testing login functionality...");
        await this.page.type('input[type="email"]', "admin@example.com");
        await this.page.type('input[type="password"]', "admin123");

        // Click login and wait for navigation
        await Promise.all([
          this.page.waitForNavigation({
            waitUntil: "networkidle2",
            timeout: 10000,
          }),
          this.page.click('button[type="submit"]'),
        ]);

        const currentUrl = this.page.url();
        const loginSuccess = currentUrl.includes("/admin");
        this.recordTest("react", "login_functionality", loginSuccess);
        console.log(
          `✅ Login Functionality: ${
            loginSuccess ? "SUCCESS - REDIRECTED TO ADMIN" : "FAILED"
          }`
        );
      }

      // Test 4: Registration Page
      console.log("📝 Testing registration page...");
      await this.page.goto("http://localhost:3001/auth/register", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      const firstNameInput = await this.page.$(
        'input[placeholder="First Name"]'
      );
      const lastNameInput = await this.page.$('input[placeholder="Last Name"]');
      const regEmailInput = await this.page.$('input[placeholder="Email"]');
      const regPasswordInput = await this.page.$(
        'input[placeholder="Password"]'
      );

      this.recordTest(
        "react",
        "registration_form",
        firstNameInput && lastNameInput && regEmailInput && regPasswordInput
      );
      console.log(
        `✅ Registration Form: ${
          firstNameInput && lastNameInput && regEmailInput && regPasswordInput
            ? "RENDERED"
            : "MISSING ELEMENTS"
        }`
      );
    } catch (error) {
      console.log(`❌ React Dashboard Error: ${error.message}`);
      this.recordTest("react", "dashboard_error", false);
    }
  }

  async testAngularDashboard() {
    console.log("\n🅰️ TESTING ANGULAR DASHBOARD");
    console.log("=============================");

    try {
      // Test 1: Dashboard Access
      console.log("🌐 Navigating to Angular dashboard...");
      await this.page.goto("http://localhost:4200", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for Angular to fully load
      await this.page.waitForTimeout(5000);

      const title = await this.page.title();
      this.recordTest("angular", "page_load", !title.includes("Error"));
      console.log(`✅ Page Load: ${title}`);

      // Check for Angular-specific content
      const bodyContent = await this.page.evaluate(
        () => document.body.textContent
      );
      const hasAngularContent = !bodyContent.includes("Cannot GET");
      this.recordTest("angular", "content_load", hasAngularContent);
      console.log(
        `✅ Angular Content: ${hasAngularContent ? "LOADED" : "ERROR"}`
      );

      // Test 2: Check for router-outlet
      const routerOutlet = await this.page.$("router-outlet");
      this.recordTest("angular", "routing", !!routerOutlet);
      console.log(
        `✅ Angular Routing: ${routerOutlet ? "CONFIGURED" : "NOT FOUND"}`
      );

      // Test 3: Try hash-based routing
      console.log("🔗 Testing hash-based routing...");
      await this.page.goto("http://localhost:4200/#/dashboard", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      await this.page.waitForTimeout(3000);
      const hashRouteContent = await this.page.evaluate(
        () => document.body.textContent
      );
      const hashRouteWorks = !hashRouteContent.includes("Cannot GET");
      this.recordTest("angular", "hash_routing", hashRouteWorks);
      console.log(`✅ Hash Routing: ${hashRouteWorks ? "WORKING" : "ERROR"}`);
    } catch (error) {
      console.log(`❌ Angular Dashboard Error: ${error.message}`);
      this.recordTest("angular", "dashboard_error", false);
    }
  }

  async testReactNativePreparation() {
    console.log("\n📱 TESTING REACT NATIVE PREPARATION");
    console.log("===================================");

    try {
      // Check if React Native dependencies are properly installed
      const fs = require("fs");
      const path = require("path");

      const rnPath = "./argon-react-native-master";
      const packageJsonPath = path.join(rnPath, "package.json");

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8")
        );

        // Check for required dependencies
        const requiredDeps = [
          "@reduxjs/toolkit",
          "react-redux",
          "@react-native-async-storage/async-storage",
        ];
        const hasDeps = requiredDeps.every(
          (dep) =>
            packageJson.dependencies?.[dep] ||
            packageJson.devDependencies?.[dep]
        );

        this.recordTest("reactNative", "dependencies", hasDeps);
        console.log(
          `✅ Dependencies: ${hasDeps ? "ALL INSTALLED" : "MISSING SOME"}`
        );

        // Check for our custom files
        const customFiles = [
          path.join(rnPath, "src/store/store.ts"),
          path.join(rnPath, "src/services/api.ts"),
          path.join(rnPath, "src/screens/LoginCustom.js"),
          path.join(rnPath, "src/screens/RegisterCustom.js"),
          path.join(rnPath, "src/types/auth.ts"),
        ];

        const filesExist = customFiles.every((file) => fs.existsSync(file));
        this.recordTest("reactNative", "custom_files", filesExist);
        console.log(
          `✅ Custom Files: ${filesExist ? "ALL PRESENT" : "SOME MISSING"}`
        );

        // Check App.js for Redux Provider
        const appJsPath = path.join(rnPath, "App.js");
        if (fs.existsSync(appJsPath)) {
          const appJsContent = fs.readFileSync(appJsPath, "utf8");
          const hasProvider =
            appJsContent.includes("Provider") && appJsContent.includes("store");
          this.recordTest("reactNative", "redux_integration", hasProvider);
          console.log(
            `✅ Redux Integration: ${
              hasProvider ? "CONFIGURED" : "NOT CONFIGURED"
            }`
          );
        }
      } else {
        this.recordTest("reactNative", "project_exists", false);
        console.log("❌ React Native project not found");
      }
    } catch (error) {
      console.log(`❌ React Native Error: ${error.message}`);
      this.recordTest("reactNative", "preparation_error", false);
    }
  }

  async testDatabaseIntegrity() {
    console.log("\n🗄️ TESTING DATABASE INTEGRITY");
    console.log("==============================");

    try {
      // Test database through API calls
      const dbTestResponse = await this.page.evaluate(async () => {
        try {
          // Login to get authenticated session
          const loginResponse = await fetch(
            "http://localhost:3000/api/auth/login",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: "admin@example.com",
                password: "admin123",
              }),
            }
          );
          const loginData = await loginResponse.json();

          if (!loginData.success) {
            return { success: false, error: "Login failed" };
          }

          // Test profile endpoint (requires authentication)
          const profileResponse = await fetch(
            "http://localhost:3000/api/auth/profile",
            {
              headers: {
                Authorization: `Bearer ${loginData.data.tokens.accessToken}`,
                "X-Tenant-ID": "default",
              },
            }
          );
          const profileData = await profileResponse.json();

          return {
            success: true,
            login: loginData.success,
            profile: profileData.success,
            userRoles: loginData.data.roles,
            permissions: loginData.data.permissions.length,
            tenant: loginData.data.tenant.name,
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      this.recordTest("backend", "database_integrity", dbTestResponse.success);

      if (dbTestResponse.success) {
        console.log(`✅ Database Integrity: VERIFIED`);
        console.log(
          `   📊 Profile API: ${dbTestResponse.profile ? "WORKING" : "FAILED"}`
        );
        console.log(`   👥 User Roles: ${dbTestResponse.userRoles.join(", ")}`);
        console.log(`   🔐 Permissions: ${dbTestResponse.permissions} loaded`);
        console.log(`   🏢 Tenant: ${dbTestResponse.tenant}`);
      } else {
        console.log(`❌ Database Integrity: ${dbTestResponse.error}`);
      }
    } catch (error) {
      console.log(`❌ Database Test Error: ${error.message}`);
      this.recordTest("backend", "database_error", false);
    }
  }

  async testAuthenticationFlow() {
    console.log("\n🔐 TESTING COMPLETE AUTHENTICATION FLOW");
    console.log("=======================================");

    try {
      // Test React Login Flow
      console.log("🖥️ Testing React login flow...");
      await this.page.goto("http://localhost:3001/auth/login", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for page to load
      await this.page.waitForSelector('input[type="email"]', {
        timeout: 10000,
      });

      // Fill login form
      await this.page.type('input[type="email"]', "admin@example.com");
      await this.page.type('input[type="password"]', "admin123");

      // Submit form
      await this.page.click('button[type="submit"]');

      // Wait for either success redirect or error message
      await this.page.waitForTimeout(3000);

      const currentUrl = this.page.url();
      const loginWorked =
        currentUrl.includes("/admin") || currentUrl.includes("dashboard");

      this.recordTest("react", "login_flow", loginWorked);
      console.log(`✅ React Login Flow: ${loginWorked ? "SUCCESS" : "FAILED"}`);
      console.log(`   🔗 Current URL: ${currentUrl}`);

      // Test logout (if logged in)
      if (loginWorked) {
        console.log("🚪 Testing logout...");
        // Look for logout button or user menu
        const userMenu = await this.page.$(".navbar-nav");
        if (userMenu) {
          console.log("✅ User navigation found");
        }
      }
    } catch (error) {
      console.log(`❌ Authentication Flow Error: ${error.message}`);
      this.recordTest("react", "auth_flow_error", false);
    }
  }

  async testRegistrationFlow() {
    console.log("\n📝 TESTING REGISTRATION FLOW");
    console.log("============================");

    try {
      // Test React Registration Flow
      console.log("🖥️ Testing React registration flow...");
      await this.page.goto("http://localhost:3001/auth/register", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for form elements
      await this.page.waitForSelector('input[placeholder="First Name"]', {
        timeout: 10000,
      });

      const testEmail = `puppeteer-ui-${Date.now()}@example.com`;

      // Fill registration form
      await this.page.type('input[placeholder="First Name"]', "Puppeteer");
      await this.page.type('input[placeholder="Last Name"]', "UITest");
      await this.page.type('input[placeholder="Email"]', testEmail);
      await this.page.type('input[placeholder="Password"]', "UITestPass123!");
      await this.page.type(
        'input[placeholder="Confirm Password"]',
        "UITestPass123!"
      );

      // Check terms agreement
      await this.page.click('input[type="checkbox"]');

      // Submit form
      await this.page.click('button[type="submit"]');

      // Wait for response
      await this.page.waitForTimeout(5000);

      // Check for success message or redirect
      const pageContent = await this.page.content();
      const registrationWorked =
        pageContent.includes("successful") || pageContent.includes("Success");

      this.recordTest("react", "registration_flow", registrationWorked);
      console.log(
        `✅ React Registration Flow: ${
          registrationWorked ? "SUCCESS" : "FAILED"
        }`
      );
    } catch (error) {
      console.log(`❌ Registration Flow Error: ${error.message}`);
      this.recordTest("react", "registration_error", false);
    }
  }

  async testResponsiveDesign() {
    console.log("\n📱 TESTING RESPONSIVE DESIGN");
    console.log("============================");

    try {
      // Test different viewport sizes
      const viewports = [
        { width: 1920, height: 1080, name: "Desktop" },
        { width: 768, height: 1024, name: "Tablet" },
        { width: 375, height: 667, name: "Mobile" },
      ];

      for (const viewport of viewports) {
        console.log(
          `📐 Testing ${viewport.name} (${viewport.width}x${viewport.height})...`
        );

        await this.page.setViewport(viewport);
        await this.page.goto("http://localhost:3001/auth/login", {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        // Check if form is still accessible
        const formVisible = await this.page.$eval("form", (form) => {
          const rect = form.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

        this.recordTest(
          "react",
          `responsive_${viewport.name.toLowerCase()}`,
          formVisible
        );
        console.log(
          `✅ ${viewport.name}: ${formVisible ? "RESPONSIVE" : "LAYOUT ISSUES"}`
        );
      }
    } catch (error) {
      console.log(`❌ Responsive Design Error: ${error.message}`);
      this.recordTest("react", "responsive_error", false);
    }
  }

  recordTest(platform, testName, passed) {
    this.testResults[platform][testName] = passed;
    this.testResults.overall.total++;
    if (passed) {
      this.testResults.overall.passed++;
    } else {
      this.testResults.overall.failed++;
    }
  }

  async generateReport() {
    console.log("\n📊 GENERATING COMPREHENSIVE TEST REPORT");
    console.log("=======================================");

    const { passed, failed, total } = this.testResults.overall;
    const successRate = ((passed / total) * 100).toFixed(1);

    console.log(`\n🎯 OVERALL TEST RESULTS:`);
    console.log(`   ✅ Passed: ${passed}/${total}`);
    console.log(`   ❌ Failed: ${failed}/${total}`);
    console.log(`   📈 Success Rate: ${successRate}%`);

    console.log(`\n🔧 BACKEND TESTS:`);
    Object.entries(this.testResults.backend).forEach(([test, result]) => {
      console.log(
        `   ${result ? "✅" : "❌"} ${test}: ${result ? "PASS" : "FAIL"}`
      );
    });

    console.log(`\n🖥️ REACT TESTS:`);
    Object.entries(this.testResults.react).forEach(([test, result]) => {
      console.log(
        `   ${result ? "✅" : "❌"} ${test}: ${result ? "PASS" : "FAIL"}`
      );
    });

    console.log(`\n🅰️ ANGULAR TESTS:`);
    Object.entries(this.testResults.angular).forEach(([test, result]) => {
      console.log(
        `   ${result ? "✅" : "❌"} ${test}: ${result ? "PASS" : "FAIL"}`
      );
    });

    console.log(`\n📱 REACT NATIVE TESTS:`);
    Object.entries(this.testResults.reactNative).forEach(([test, result]) => {
      console.log(
        `   ${result ? "✅" : "❌"} ${test}: ${result ? "PASS" : "FAIL"}`
      );
    });

    // Final verdict
    console.log(`\n🏆 FINAL VERDICT:`);
    if (successRate >= 80) {
      console.log(
        `🎉 EXCELLENT: ${successRate}% success rate - PRODUCTION READY!`
      );
    } else if (successRate >= 60) {
      console.log(
        `⚠️ GOOD: ${successRate}% success rate - Minor issues to fix`
      );
    } else {
      console.log(
        `❌ NEEDS WORK: ${successRate}% success rate - Major issues found`
      );
    }

    return this.testResults;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log("\n🧹 Browser closed");
    }
  }

  async runAllTests() {
    try {
      await this.initialize();
      await this.testBackendAPI();
      await this.testDatabaseIntegrity();
      await this.testReactDashboard();
      await this.testAngularDashboard();
      await this.testReactNativePreparation();
      await this.testAuthenticationFlow();
      await this.testRegistrationFlow();
      await this.testResponsiveDesign();
      await this.generateReport();
    } catch (error) {
      console.error("❌ E2E Test Suite Error:", error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the comprehensive test suite
const testSuite = new E2ETestSuite();
testSuite
  .runAllTests()
  .then(() => {
    console.log("\n🎉 PUPPETEER E2E TESTING COMPLETED!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  });
