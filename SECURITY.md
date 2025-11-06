# Security Guidelines

## Reporting Security Issues

If you discover a security vulnerability, please email security@prayer.so instead of using the public issue tracker.

## Environment Variables

**CRITICAL**: Never commit `.env` files or expose API keys

- `.env` is in `.gitignore` - keep it that way
- Use `.env.example` as a template
- Rotate all keys if accidentally exposed
- Use different credentials for development and production

## Supabase Security

- Row Level Security (RLS) is enabled on all tables
- Never disable RLS in production
- Test RLS policies thoroughly before deploying
- Use service role key only in secure backend functions

## LiveKit Security

- API keys should only be in environment variables
- Token generation happens server-side via Supabase Edge Function
- Never expose API secrets to the client

## Authentication

- Passwords must be at least 6 characters (Supabase default)
- Consider adding email verification in production
- Implement rate limiting on auth endpoints
- Use secure session management (handled by Supabase)

## User Input

- All user input is parameterized through Supabase SDK (prevents SQL injection)
- Consider adding input sanitization for displayed content
- Validate file uploads if photo upload is implemented
- Set appropriate content length limits

## CORS & API Security

- Configure CORS appropriately in production
- Use environment-specific API URLs
- Implement rate limiting on API endpoints
- Monitor for unusual traffic patterns

## Deployment Checklist

Before deploying to production:

- [ ] Verify `.env` is not in repository
- [ ] Rotate all development credentials
- [ ] Enable Supabase email verification
- [ ] Set up error monitoring (Sentry)
- [ ] Configure CORS for production domain only
- [ ] Enable rate limiting
- [ ] Set up security headers
- [ ] Test RLS policies thoroughly
- [ ] Review and audit all authentication flows
- [ ] Set up logging and monitoring

## Dependencies

- Regularly update dependencies (`npm audit`)
- Review security advisories
- Use `npm audit fix` for automatic patches
- Test thoroughly after updates

## Code Review

Before merging to main:

- Review for hardcoded secrets
- Check for sensitive data logging
- Verify RLS policy changes
- Test authentication flows
- Review permission changes
