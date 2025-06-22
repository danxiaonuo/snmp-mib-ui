# Compatibility Guide

This guide provides solutions for common compatibility issues when running the MIB Platform in different environments.

## Common Issues and Solutions

### Frontend Rendering Issues

If you experience frontend rendering issues, CSS problems, or layout inconsistencies:

1. **Use Compatibility Mode**:
   ```bash
   npm run dev:compat
   # or
   yarn dev:compat
   # or
   pnpm dev:compat
   ```

   This mode uses simplified layouts and reduces resource usage.

2. **Check Environment Compatibility**:
   ```bash
   npm run check-compat
   ```
   
   This will analyze your environment and provide recommendations.

### Low Memory Environments

If you're running in an environment with limited memory:

1. **Use Simple Development Mode**:
   ```bash
   npm run dev:simple
   ```

   This reduces memory usage by limiting Node.js memory allocation.

2. **Disable Browser Extensions**:
   Some browser extensions can interfere with the application. Try using incognito/private mode.

### Docker Environment Issues

If running in Docker:

1. **Ensure Sufficient Resources**:
   - At least 2GB of memory allocated to the container
   - Sufficient CPU allocation

2. **Use the Production Docker Image**:
   ```bash
   docker-compose -f docker-compose.yml up --build
   ```

### Cross-Browser Compatibility

The application is optimized for:
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

For older browsers, use compatibility mode:
```bash
NEXT_PUBLIC_COMPATIBILITY_MODE=true npm run dev
```

### Character Encoding Issues

If you see strange characters in the UI:
1. Ensure your terminal and editor are using UTF-8 encoding
2. For Docker environments, set the locale:
   ```
   ENV LANG=C.UTF-8
   ENV LC_ALL=C.UTF-8
   ```

## Troubleshooting Steps

1. **Clear Cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Reinstall Dependencies**:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Check for Environment Variables**:
   Make sure all required environment variables are set.

4. **Test with Simple Page**:
   Navigate to `/test-simple` to test basic functionality.

## Reporting Issues

If you continue to experience issues, please report them with:
1. Environment details (OS, Node version, browser)
2. Steps to reproduce
3. Screenshots or error messages
4. Console logs