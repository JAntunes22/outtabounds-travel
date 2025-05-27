const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  static log(message, ...args) {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  }

  static warn(message, ...args) {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  }

  static error(message, ...args) {
    // Always log errors, even in production
    console.error(message, ...args);
  }

  static debug(message, ...args) {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  static info(message, ...args) {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  }
}

export default Logger; 