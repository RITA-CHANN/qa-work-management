import { msg } from './define';

/** Messages shared by every feature. Business text: docs/requirements/common/messages.md. */
export const COMMON_MESSAGES = {
  unexpected: msg('MSG-COMMON-01', 'Something went wrong. Please try again.'),
  serverError: msg(
    'MSG-COMMON-02',
    'Something went wrong. Quote the requestId when reporting this.',
  ),
  invalidJson: msg('MSG-COMMON-03', 'Request body is not valid JSON'),
  validationFailed: msg('MSG-COMMON-04', 'Request validation failed'),
  authRequired: msg('MSG-COMMON-05', 'Authentication required'),
  forbidden: msg('MSG-COMMON-06', 'You do not have permission to do this'),
  notFound: msg('MSG-COMMON-07', 'Resource not found'),
  routeNotFound: msg('MSG-COMMON-08', 'Route {method} {path} does not exist'),
  jsonRequired: msg('MSG-COMMON-09', 'Content-Type must be application/json'),
  apiChecking: msg('MSG-COMMON-10', 'Checking…'),
  apiOnline: msg('MSG-COMMON-11', 'Online'),
  apiOffline: msg('MSG-COMMON-12', 'Offline'),
  pageNotFound: msg('MSG-COMMON-13', 'Page not found'),
  pageNotFoundHint: msg('MSG-COMMON-14', 'The page you are looking for does not exist.'),
} as const;
