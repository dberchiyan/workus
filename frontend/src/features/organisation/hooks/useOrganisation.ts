import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth';
import type { ApiError } from '@/shared/api/apiError';
import { organisationApi } from '../api/organisationApi';
import type {
  Administrator,
  AdministratorPage,
  ChangeRoleRequest,
  Organisation,
  RegistrationRequest,
  UpdateOrganisationRequest,
} from '../types';
import { organisationKeys } from './queryKeys';

/**
 * Registers a company. The answer signs the new owner in, so everything cached for the visitor
 * (e.g. "not signed in") is dropped and the app loads afresh as them.
 */
export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation<Organisation, ApiError, RegistrationRequest>({
    mutationFn: organisationApi.register,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useOrganisation = () =>
  useQuery({ queryKey: organisationKeys.current(), queryFn: organisationApi.find });

/** The name changes everywhere it shows (the account menu reads it from the signed-in user). */
export const useRenameOrganisation = () => {
  const queryClient = useQueryClient();
  return useMutation<Organisation, ApiError, UpdateOrganisationRequest>({
    mutationFn: organisationApi.rename,
    onSuccess: async (organisation) => {
      queryClient.setQueryData(organisationKeys.current(), organisation);
      // The account menu shows the name from /auth/me.
      await queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
};

export const useAdministrators = (search: string, page: number) =>
  useQuery<AdministratorPage>({
    queryKey: organisationKeys.administratorsPage(search, page),
    queryFn: () => organisationApi.administrators(search, page),
    placeholderData: keepPreviousData,
  });

/**
 * Changing someone's role ends their sessions; changing one's own keeps this session with the
 * new rights — so the signed-in user is re-read too.
 */
export const useChangeRole = () => {
  const queryClient = useQueryClient();
  return useMutation<Administrator, ApiError, { userId: string; request: ChangeRoleRequest }>({
    mutationFn: ({ userId, request }) => organisationApi.changeRole(userId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: organisationKeys.administrators() }),
        queryClient.invalidateQueries({ queryKey: authKeys.me() }),
      ]);
    },
  });
};
