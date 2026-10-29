export const validatePassword = (password: string): string | null => {
  if (!password || password.length < 8) {
    return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  } else if (!/[a-z]/.test(password)) {
    return "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل";
  } else if (!/[A-Z]/.test(password)) {
    return "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل";
  } else if (!/\d/.test(password)) {
    return "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل";
  } else if (!/[^a-zA-Z0-9]/.test(password)) {
    return "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل";
  }

  return null;
};
