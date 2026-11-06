import { useLocation } from 'react-router';
import { PATHS } from '@/shared/lib/paths';

export interface LoginLocationState {
  from?: string;
  reason?: 'sessionExpired';
}

const isLoginLocationState = (value: unknown): value is LoginLocationState =>
  typeof value === 'object' && value !== null;

/** Where to go after sign-in: the intended path, or home. Only same-app paths are accepted. */
export const useLoginRedirect = (): { target: string; isSessionExpired: boolean } => {
  const location = useLocation();
  const state: unknown = location.state;
  const loginState: LoginLocationState = isLoginLocationState(state) ? state : {};
  const from = typeof loginState.from === 'string' ? loginState.from : undefined;
  const isSafe = from?.startsWith('/') === true && !from.startsWith('//') && from !== PATHS.login;
  return {
    target: isSafe ? from : PATHS.dashboard,
    isSessionExpired: loginState.reason === 'sessionExpired',
  };
};
