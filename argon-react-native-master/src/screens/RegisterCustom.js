import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  ImageBackground,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { Block, Checkbox, Text, theme } from "galio-framework";
import { Button, Icon, Input } from "../components";
import { Images, argonTheme } from "../constants";
import { useDispatch, useSelector } from "react-redux";
import apiService from "../services/api";

const { width, height } = Dimensions.get("screen");

const RegisterCustom = ({ navigation, route }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Check if this is an invitation
  const invitationToken = route.params?.token;
  const isInvitation = !!invitationToken;

  useEffect(() => {
    if (isAuthenticated) {
      navigation.navigate("App");
    }
  }, [isAuthenticated, navigation]);

  // Pre-fill email if coming from invitation
  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params]);

  const validateForm = () => {
    if (!firstName.trim()) {
      Alert.alert("Validation Error", "First name is required");
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert("Validation Error", "Last name is required");
      return false;
    }

    if (!email.trim()) {
      Alert.alert("Validation Error", "Email is required");
      return false;
    }

    if (!email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }

    if (!password) {
      Alert.alert("Validation Error", "Password is required");
      return false;
    }

    if (password.length < 8) {
      Alert.alert("Validation Error", "Password must be at least 8 characters long");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return false;
    }

    if (!agreeToTerms) {
      Alert.alert("Validation Error", "Please agree to the terms and conditions");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = {
        email: email.toLowerCase().trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(invitationToken && { invitationToken }),
      };

      let response;
      if (isInvitation) {
        response = await apiService.request("/auth/accept-invitation", {
          method: "POST",
          body: {
            token: invitationToken,
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          },
        });
      } else {
        response = await apiService.request("/auth/register", {
          method: "POST",
          body: registrationData,
        });
      }

      if (response.success) {
        Alert.alert(
          "Success!",
          response.data.message || "Registration successful!",
          [
            {
              text: "OK",
              onPress: () => {
                if (!response.data.requiresVerification) {
                  navigation.navigate("Login", {
                    message: "Registration successful! Please log in.",
                  });
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        error.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { strength: "", color: "", percentage: 0 };

    let score = 0;

    // Length
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character types
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      return { strength: "weak", color: "#f5365c", percentage: 25 };
    } else if (score <= 4) {
      return { strength: "fair", color: "#fb6340", percentage: 50 };
    } else if (score <= 5) {
      return { strength: "good", color: "#11cdef", percentage: 75 };
    } else {
      return { strength: "strong", color: "#2dce89", percentage: 100 };
    }
  };

  return (
    <Block flex middle>
      <StatusBar hidden />
      <ImageBackground
        source={Images.RegisterBackground}
        style={{ width, height, zIndex: 1 }}
      >
        <Block safe flex middle>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Block style={styles.registerContainer}>
              <Block flex={0.2} middle style={styles.socialConnect}>
                <Text color="#8898AA" size={12}>
                  {isInvitation ? "Complete your invitation" : "Sign up for a new account"}
                </Text>
              </Block>

              <Block flex middle>
                <Block style={styles.registerForm}>
                  {/* First Name */}
                  <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                    <Input
                      borderless
                      placeholder="First Name"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      iconContent={
                        <Icon
                          size={16}
                          color={argonTheme.COLORS.ICON}
                          name="hat-3"
                          family="ArgonExtra"
                          style={styles.inputIcons}
                        />
                      }
                    />
                  </Block>

                  {/* Last Name */}
                  <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                    <Input
                      borderless
                      placeholder="Last Name"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                      iconContent={
                        <Icon
                          size={16}
                          color={argonTheme.COLORS.ICON}
                          name="hat-3"
                          family="ArgonExtra"
                          style={styles.inputIcons}
                        />
                      }
                    />
                  </Block>

                  {/* Email */}
                  <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                    <Input
                      borderless
                      placeholder="Email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isInvitation}
                      iconContent={
                        <Icon
                          size={16}
                          color={argonTheme.COLORS.ICON}
                          name="ic_mail_24px"
                          family="ArgonExtra"
                          style={styles.inputIcons}
                        />
                      }
                    />
                  </Block>

                  {/* Password */}
                  <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                    <Input
                      password
                      borderless
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      iconContent={
                        <Icon
                          size={16}
                          color={argonTheme.COLORS.ICON}
                          name="padlock-unlocked"
                          family="ArgonExtra"
                          style={styles.inputIcons}
                        />
                      }
                    />
                  </Block>

                  {/* Confirm Password */}
                  <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                    <Input
                      password
                      borderless
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      iconContent={
                        <Icon
                          size={16}
                          color={argonTheme.COLORS.ICON}
                          name="padlock-unlocked"
                          family="ArgonExtra"
                          style={styles.inputIcons}
                        />
                      }
                    />
                  </Block>

                  {/* Password Strength */}
                  {password && (
                    <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                      <Text size={12} color="#8898AA">
                        Password strength:{" "}
                        <Text size={12} color={getPasswordStrength().color} bold>
                          {getPasswordStrength().strength}
                        </Text>
                      </Text>
                    </Block>
                  )}

                  {/* Terms Agreement */}
                  <Block row width={width * 0.75} style={{ marginBottom: 15 }}>
                    <Checkbox
                      checkboxStyle={{
                        borderWidth: 3,
                      }}
                      color={argonTheme.COLORS.PRIMARY}
                      label="I agree to the Terms and Privacy Policy"
                      labelStyle={{
                        color: argonTheme.COLORS.HEADER,
                        fontFamily: "open-sans-regular",
                        fontSize: 12,
                      }}
                      onChange={(value) => setAgreeToTerms(value)}
                    />
                  </Block>

                  {/* Register Button */}
                  <Block middle>
                    <Button
                      color="primary"
                      style={styles.createButton}
                      onPress={handleRegister}
                      loading={isLoading}
                      disabled={!agreeToTerms}
                    >
                      <Text bold size={14} color={argonTheme.COLORS.WHITE}>
                        {isLoading
                          ? "CREATING ACCOUNT..."
                          : isInvitation
                          ? "ACCEPT INVITATION"
                          : "CREATE ACCOUNT"}
                      </Text>
                    </Button>
                  </Block>

                  {/* Login Link */}
                  {!isInvitation && (
                    <Block middle style={{ marginTop: 20 }}>
                      <Text color={argonTheme.COLORS.HEADER} size={12}>
                        Already have an account?{" "}
                        <Text
                          color={argonTheme.COLORS.PRIMARY}
                          size={12}
                          onPress={() => navigation.navigate("Login")}
                        >
                          Sign in
                        </Text>
                      </Text>
                    </Block>
                  )}
                </Block>
              </Block>
            </Block>
          </ScrollView>
        </Block>
      </ImageBackground>
    </Block>
  );
};

const styles = StyleSheet.create({
  registerContainer: {
    width: width * 0.9,
    minHeight: height * 0.85,
    backgroundColor: "#F4F5F7",
    borderRadius: 4,
    shadowColor: argonTheme.COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 8,
    shadowOpacity: 0.1,
    elevation: 1,
    overflow: "hidden",
    marginVertical: 20,
  },
  socialConnect: {
    backgroundColor: argonTheme.COLORS.WHITE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#8898AA",
  },
  registerForm: {
    marginTop: 20,
    paddingBottom: 30,
  },
  inputIcons: {
    marginRight: 12,
  },
  createButton: {
    width: width * 0.5,
    marginTop: 25,
  },
});

export default RegisterCustom;
