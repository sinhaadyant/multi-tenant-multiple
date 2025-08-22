import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  ImageBackground,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Block, Checkbox, Text, theme } from "galio-framework";
import { Button, Icon, Input } from "../components";
import { Images, argonTheme } from "../constants";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../store/slices/authSlice";

const { width, height } = Dimensions.get("screen");

const LoginCustom = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigation.navigate("App");
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    if (error) {
      Alert.alert("Login Error", error, [
        { text: "OK", onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error, dispatch]);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Validation Error", "Please fill in all fields");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return;
    }

    dispatch(
      loginUser({
        email: email.toLowerCase().trim(),
        password,
        rememberMe,
      })
    );
  };

  return (
    <Block flex middle>
      <StatusBar hidden />
      <ImageBackground
        source={Images.RegisterBackground}
        style={{ width, height, zIndex: 1 }}
      >
        <Block safe flex middle>
          <Block style={styles.registerContainer}>
            <Block flex={0.25} middle style={styles.socialConnect}>
              <Text color="#8898AA" size={12}>
                Sign in to your account
              </Text>
            </Block>

            <Block flex middle>
              <Block style={styles.registerForm}>
                <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                  <Input
                    borderless
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
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

                <Block row width={width * 0.75}>
                  <Checkbox
                    checkboxStyle={{
                      borderWidth: 3,
                    }}
                    color={argonTheme.COLORS.PRIMARY}
                    label="Remember me"
                    labelStyle={{
                      color: argonTheme.COLORS.HEADER,
                      fontFamily: "open-sans-regular",
                    }}
                    onChange={(value) => setRememberMe(value)}
                  />
                </Block>

                <Block middle>
                  <Button
                    color="primary"
                    style={styles.createButton}
                    onPress={handleLogin}
                    loading={isLoading}
                  >
                    <Text bold size={14} color={argonTheme.COLORS.WHITE}>
                      {isLoading ? "SIGNING IN..." : "SIGN IN"}
                    </Text>
                  </Button>
                </Block>

                <Block middle style={{ marginTop: 20 }}>
                  <Text color={argonTheme.COLORS.HEADER} size={12}>
                    Forgot your password?{" "}
                    <Text
                      color={argonTheme.COLORS.PRIMARY}
                      size={12}
                      onPress={() =>
                        Alert.alert(
                          "Info",
                          "Password reset feature coming soon"
                        )
                      }
                    >
                      Reset here
                    </Text>
                  </Text>
                </Block>

                <Block middle style={{ marginTop: 10 }}>
                  <Text color={argonTheme.COLORS.HEADER} size={12}>
                    Don't have an account?{" "}
                    <Text
                      color={argonTheme.COLORS.PRIMARY}
                      size={12}
                      onPress={() => navigation.navigate("Register")}
                    >
                      Sign up
                    </Text>
                  </Text>
                </Block>
              </Block>
            </Block>
          </Block>
        </Block>
      </ImageBackground>
    </Block>
  );
};

const styles = StyleSheet.create({
  registerContainer: {
    width: width * 0.9,
    height: height * 0.78,
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
  },
  socialConnect: {
    backgroundColor: argonTheme.COLORS.WHITE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#8898AA",
  },
  registerForm: {
    marginTop: 30,
  },
  inputIcons: {
    marginRight: 12,
  },
  createButton: {
    width: width * 0.5,
    marginTop: 25,
  },
});

export default LoginCustom;
