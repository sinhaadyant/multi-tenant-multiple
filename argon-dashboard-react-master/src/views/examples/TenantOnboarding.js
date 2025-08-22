import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Form,
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Row,
  Col,
  Alert,
  Progress,
} from "reactstrap";

const TenantOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Organization Info
  const [orgName, setOrgName] = useState("");
  const [orgDomain, setOrgDomain] = useState("");
  const [orgSize, setOrgSize] = useState("");

  // Step 2: Admin User Info
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 3: Settings
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [requireEmailVerification, setRequireEmailVerification] =
    useState(true);
  const [maxUsers, setMaxUsers] = useState("100");

  const navigate = useNavigate();

  const totalSteps = 3;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const validateStep1 = () => {
    if (!orgName.trim()) {
      setError("Organization name is required");
      return false;
    }
    if (!orgDomain.trim()) {
      setError("Organization domain is required");
      return false;
    }
    if (!orgSize) {
      setError("Please select organization size");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!adminFirstName.trim() || !adminLastName.trim()) {
      setError("Admin name is required");
      return false;
    }
    if (!adminEmail.trim() || !adminEmail.includes("@")) {
      setError("Valid admin email is required");
      return false;
    }
    if (!adminPassword || adminPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (adminPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);

    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);
    setError(null);

    try {
      // This would create a new tenant and admin user
      const tenantData = {
        organization: {
          name: orgName.trim(),
          domain: orgDomain.trim(),
          size: orgSize,
          settings: {
            allowRegistration,
            requireEmailVerification,
            maxUsers: parseInt(maxUsers),
          },
        },
        admin: {
          firstName: adminFirstName.trim(),
          lastName: adminLastName.trim(),
          email: adminEmail.toLowerCase().trim(),
          password: adminPassword,
        },
      };

      // This endpoint would need to be created in the backend
      console.log("Creating tenant:", tenantData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert(
        "Success!",
        "Your organization has been created successfully! Please check your email for verification instructions.",
        [
          {
            text: "Continue to Login",
            onPress: () =>
              navigate("/auth/login", {
                state: { message: "Organization created! Please log in." },
              }),
          },
        ]
      );
    } catch (error) {
      setError("Failed to create organization. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <h3 className="text-center mb-4">Organization Information</h3>

      <FormGroup>
        <InputGroup className="input-group-alternative mb-3">
          <InputGroupAddon addonType="prepend">
            <InputGroupText>
              <i className="ni ni-building" />
            </InputGroupText>
          </InputGroupAddon>
          <Input
            placeholder="Organization Name"
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            disabled={isLoading}
          />
        </InputGroup>
      </FormGroup>

      <FormGroup>
        <InputGroup className="input-group-alternative mb-3">
          <InputGroupAddon addonType="prepend">
            <InputGroupText>
              <i className="ni ni-world-2" />
            </InputGroupText>
          </InputGroupAddon>
          <Input
            placeholder="Domain (e.g., mycompany)"
            type="text"
            value={orgDomain}
            onChange={(e) => setOrgDomain(e.target.value)}
            disabled={isLoading}
          />
        </InputGroup>
        <small className="text-muted">
          Your organization will be accessible at: {orgDomain}.yourdomain.com
        </small>
      </FormGroup>

      <FormGroup>
        <Input
          type="select"
          value={orgSize}
          onChange={(e) => setOrgSize(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select organization size</option>
          <option value="1-10">1-10 employees</option>
          <option value="11-50">11-50 employees</option>
          <option value="51-200">51-200 employees</option>
          <option value="201-1000">201-1000 employees</option>
          <option value="1000+">1000+ employees</option>
        </Input>
      </FormGroup>
    </>
  );

  const renderStep2 = () => (
    <>
      <h3 className="text-center mb-4">Admin Account</h3>

      <Row>
        <Col md="6">
          <FormGroup>
            <InputGroup className="input-group-alternative mb-3">
              <InputGroupAddon addonType="prepend">
                <InputGroupText>
                  <i className="ni ni-hat-3" />
                </InputGroupText>
              </InputGroupAddon>
              <Input
                placeholder="First Name"
                type="text"
                value={adminFirstName}
                onChange={(e) => setAdminFirstName(e.target.value)}
                disabled={isLoading}
              />
            </InputGroup>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <InputGroup className="input-group-alternative mb-3">
              <InputGroupAddon addonType="prepend">
                <InputGroupText>
                  <i className="ni ni-hat-3" />
                </InputGroupText>
              </InputGroupAddon>
              <Input
                placeholder="Last Name"
                type="text"
                value={adminLastName}
                onChange={(e) => setAdminLastName(e.target.value)}
                disabled={isLoading}
              />
            </InputGroup>
          </FormGroup>
        </Col>
      </Row>

      <FormGroup>
        <InputGroup className="input-group-alternative mb-3">
          <InputGroupAddon addonType="prepend">
            <InputGroupText>
              <i className="ni ni-email-83" />
            </InputGroupText>
          </InputGroupAddon>
          <Input
            placeholder="Admin Email"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            disabled={isLoading}
          />
        </InputGroup>
      </FormGroup>

      <FormGroup>
        <InputGroup className="input-group-alternative mb-3">
          <InputGroupAddon addonType="prepend">
            <InputGroupText>
              <i className="ni ni-lock-circle-open" />
            </InputGroupText>
          </InputGroupAddon>
          <Input
            placeholder="Password"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            disabled={isLoading}
          />
        </InputGroup>
      </FormGroup>

      <FormGroup>
        <InputGroup className="input-group-alternative mb-3">
          <InputGroupAddon addonType="prepend">
            <InputGroupText>
              <i className="ni ni-lock-circle-open" />
            </InputGroupText>
          </InputGroupAddon>
          <Input
            placeholder="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
        </InputGroup>
      </FormGroup>
    </>
  );

  const renderStep3 = () => (
    <>
      <h3 className="text-center mb-4">Organization Settings</h3>

      <FormGroup check>
        <Input
          type="checkbox"
          id="allowRegistration"
          checked={allowRegistration}
          onChange={(e) => setAllowRegistration(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="allowRegistration">
          Allow user self-registration
        </label>
      </FormGroup>

      <FormGroup check>
        <Input
          type="checkbox"
          id="requireEmailVerification"
          checked={requireEmailVerification}
          onChange={(e) => setRequireEmailVerification(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="requireEmailVerification">
          Require email verification for new users
        </label>
      </FormGroup>

      <FormGroup>
        <label>Maximum number of users</label>
        <Input
          type="select"
          value={maxUsers}
          onChange={(e) => setMaxUsers(e.target.value)}
        >
          <option value="50">50 users</option>
          <option value="100">100 users</option>
          <option value="500">500 users</option>
          <option value="1000">1000 users</option>
          <option value="5000">5000 users</option>
        </Input>
      </FormGroup>
    </>
  );

  return (
    <Col lg="8" md="10">
      <Card className="bg-secondary shadow border-0">
        <CardHeader className="bg-transparent pb-5">
          <div className="text-muted text-center mt-2 mb-4">
            <small>Create Your Organization</small>
          </div>
          <div className="text-center">
            <Progress
              max={100}
              value={progressPercentage}
              color="primary"
              className="mb-3"
            />
            <small className="text-muted">
              Step {currentStep} of {totalSteps}
            </small>
          </div>
        </CardHeader>
        <CardBody className="px-lg-5 py-lg-5">
          {error && (
            <Alert color="danger" className="mb-4">
              <strong>Error!</strong> {error}
            </Alert>
          )}

          <Form role="form">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <div className="text-center mt-4">
              <Row>
                <Col>
                  {currentStep > 1 && (
                    <Button
                      color="secondary"
                      type="button"
                      onClick={handlePrevious}
                      disabled={isLoading}
                    >
                      Previous
                    </Button>
                  )}
                </Col>
                <Col>
                  {currentStep < totalSteps ? (
                    <Button
                      color="primary"
                      type="button"
                      onClick={handleNext}
                      disabled={isLoading}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      color="success"
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating..." : "Create Organization"}
                    </Button>
                  )}
                </Col>
              </Row>
            </div>
          </Form>
        </CardBody>
      </Card>
    </Col>
  );
};

export default TenantOnboarding;
