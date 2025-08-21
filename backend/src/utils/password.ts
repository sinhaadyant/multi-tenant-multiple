import bcrypt from "bcryptjs";

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Higher salt rounds for better security
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Password strength validation
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4 (weak to strong)
  feedback: string[];
}

export const validatePasswordStrength = (
  password: string
): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    feedback.push("Password must be at least 8 characters long");
  } else if (password.length >= 12) {
    score += 1;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    feedback.push("Password must contain at least one uppercase letter");
  } else {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    feedback.push("Password must contain at least one lowercase letter");
  } else {
    score += 1;
  }

  // Number check
  if (!/\d/.test(password)) {
    feedback.push("Password must contain at least one number");
  } else {
    score += 1;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push("Password must contain at least one special character");
  } else {
    score += 1;
  }

  // Common patterns check
  if (/(.)\1{2,}/.test(password)) {
    feedback.push("Password should not contain repeated characters");
    score = Math.max(0, score - 1);
  }

  // Sequential characters check
  if (/123|abc|qwe/i.test(password)) {
    feedback.push("Password should not contain sequential characters");
    score = Math.max(0, score - 1);
  }

  const isValid = feedback.length === 0 && password.length >= 8;

  return {
    isValid,
    score: Math.min(score, 4),
    feedback,
  };
};

/**
 * Generate random password
 */
export const generateRandomPassword = (length = 12): string => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = uppercase + lowercase + numbers + symbols;
  let password = "";

  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

/**
 * Check if password has been compromised (basic check against common passwords)
 */
export const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    "password",
    "123456",
    "password123",
    "admin",
    "qwerty",
    "letmein",
    "welcome",
    "monkey",
    "1234567890",
    "abc123",
    "password1",
    "iloveyou",
    "123123",
    "admin123",
    "welcome123",
  ];

  return commonPasswords.includes(password.toLowerCase());
};
