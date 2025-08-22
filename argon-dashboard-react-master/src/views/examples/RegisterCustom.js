import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
} from "reactstrap";

import { setError } from "../../store/store";

const RegisterCustom = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("token");
  const isInvitation = !!invitationToken;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // API call function
  const callRegisterAPI = async (userData) => {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return await response.json();
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/index");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const validateForm = () => {
    if (!email || !password || !firstName || !lastName) {
      dispatch(setError("Please fill in all required fields"));
      return false;
    }

    if (!email.includes("@")) {
      dispatch(setError("Please enter a valid email address"));
      return false;
    }

    if (password.length < 8) {
      dispatch(setError("Password must be at least 8 characters long"));
      return false;
    }

    if (password !== confirmPassword) {
      dispatch(setError("Passwords do not match"));
      return false;
    }

    if (!agreeToTerms) {
      dispatch(setError("Please agree to the terms and conditions"));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    dispatch(setError(null));

    try {
      const registrationData = {
        email: email.toLowerCase().trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(invitationToken && { invitationToken }),
      };

      const result = await callRegisterAPI(registrationData);

      if (result.success) {
        setSuccessMessage(result.data.message);

        // If registration successful and doesn't require verification, redirect to login
        if (!result.data.requiresVerification) {
          setTimeout(() => {
            navigate("/auth/login", {
              state: { message: "Registration successful! Please log in." },
            });
          }, 2000);
        }
      } else {
        dispatch(setError(result.message || "Registration failed"));
      }
    } catch (error) {
      dispatch(setError(error.message || "Registration failed"));
    }
  };

  return (
    <>
      <Col lg="6" md="8">
        <Card className="bg-secondary shadow border-0">
          <CardHeader className="bg-transparent pb-5">
            <div className="text-muted text-center mt-2 mb-4">
              <small>
                {isInvitation
                  ? "Complete your invitation"
                  : "Sign up for a new account"}
              </small>
            </div>
          </CardHeader>
          <CardBody className="px-lg-5 py-lg-5">
            {showAlert && error && (
              <Alert color="danger" className="mb-4">
                <strong>Error!</strong> {error}
              </Alert>
            )}

            {successMessage && (
              <Alert color="success" className="mb-4">
                <strong>Success!</strong> {successMessage}
              </Alert>
            )}

            <Form role="form" onSubmit={handleSubmit}>
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
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </InputGroup>
              </FormGroup>

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
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </InputGroup>
              </FormGroup>

              <FormGroup>
                <InputGroup className="input-group-alternative mb-3">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText>
                      <i className="ni ni-email-83" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <Input
                    placeholder="Email"
                    type="email"
                    autoComplete="new-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || isInvitation}
                    required
                  />
                </InputGroup>
              </FormGroup>

              <FormGroup>
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText>
                      <i className="ni ni-lock-circle-open" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <Input
                    placeholder="Password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </InputGroup>
              </FormGroup>

              <FormGroup>
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText>
                      <i className="ni ni-lock-circle-open" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <Input
                    placeholder="Confirm Password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </InputGroup>
              </FormGroup>

              <div className="text-muted font-italic">
                <small>
                  Password strength:{" "}
                  <span className="text-success font-weight-700">strong</span>
                </small>
              </div>

              <Row className="my-4">
                <Col xs="12">
                  <div className="custom-control custom-control-alternative custom-checkbox">
                    <input
                      className="custom-control-input"
                      id="customCheckRegister"
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      disabled={isLoading}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="customCheckRegister"
                    >
                      <span className="text-muted">
                        I agree with the{" "}
                        <a href="#pablo" onClick={(e) => e.preventDefault()}>
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>
                </Col>
              </Row>

              <div className="text-center">
                <Button
                  className="mt-4"
                  color="primary"
                  type="submit"
                  disabled={isLoading || !agreeToTerms}
                >
                  {isLoading
                    ? "Creating account..."
                    : isInvitation
                    ? "Accept Invitation"
                    : "Create account"}
                </Button>
              </div>
            </Form>
          </CardBody>
        </Card>

        {!isInvitation && (
          <Row className="mt-3">
            <Col xs="6">
              <Link className="text-light" to="/auth/login">
                <small>Already have an account?</small>
              </Link>
            </Col>
          </Row>
        )}
      </Col>
    </>
  );
};

export default RegisterCustom;
